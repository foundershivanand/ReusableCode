import { createHash, randomUUID } from "node:crypto";
import {
  Experiment,
  VariantDefinition,
  VariantAssignment,
  ConversionEvent,
  RawMetricsReport,
  RawVariantMetrics,
  ExperimentStatus,
} from "../schemas/experiment-schemas.js";
import { ExperimentationRepository } from "./repository.js";

export interface UserExperimentContext {
  userId: string;
  plan?: string;
  country?: string;
  accountAgeDays?: number;
}

export class ExperimentationService {
  constructor(private repository: ExperimentationRepository) {}

  private hashToBucket(seed: string): number {
    const hash = createHash("sha256").update(seed).digest("hex");
    const intVal = parseInt(hash.substring(0, 8), 16);
    return intVal % 100; // 0 to 99
  }

  async createExperiment(params: {
    key: string;
    name: string;
    description: string;
    variants: VariantDefinition[];
    primaryMetric: string;
    secondaryMetrics?: string[];
    mutualExclusionGroup?: string;
    eligibilityRules?: {
      allowedPlans?: string[];
      allowedCountries?: string[];
      minAccountAgeDays?: number;
    };
    attributionWindowHours?: number;
  }): Promise<Experiment> {
    const existing = await this.repository.getExperimentByKey(params.key);
    if (existing) {
      throw new Error(`Experiment with key '${params.key}' already exists`);
    }

    const totalWeight = params.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100% (currently ${totalWeight}%)`);
    }

    const controlCount = params.variants.filter((v) => v.isControl).length;
    if (controlCount !== 1) {
      throw new Error("Exactly one variant must be marked as control (isControl: true)");
    }

    const exp: Experiment = {
      id: randomUUID(),
      key: params.key,
      name: params.name,
      description: params.description,
      status: "DRAFT",
      variants: params.variants,
      mutualExclusionGroup: params.mutualExclusionGroup || null,
      eligibilityRules: params.eligibilityRules || {},
      primaryMetric: params.primaryMetric,
      secondaryMetrics: params.secondaryMetrics || [],
      attributionWindowHours: params.attributionWindowHours || 72,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repository.saveExperiment(exp);
    return exp;
  }

  async updateStatus(experimentKey: string, newStatus: ExperimentStatus): Promise<Experiment> {
    const exp = await this.repository.getExperimentByKey(experimentKey);
    if (!exp) {
      throw new Error(`Experiment '${experimentKey}' not found`);
    }

    exp.status = newStatus;
    exp.updatedAt = new Date().toISOString();
    await this.repository.saveExperiment(exp);
    return exp;
  }

  async getVariant(
    experimentKey: string,
    context: UserExperimentContext
  ): Promise<{ variant: VariantDefinition | null; isEligible: boolean; assignment?: VariantAssignment }> {
    const exp = await this.repository.getExperimentByKey(experimentKey);
    if (!exp || exp.status !== "RUNNING") {
      const control = exp?.variants.find((v) => v.isControl) || null;
      return { variant: control, isEligible: false };
    }

    const controlVariant = exp.variants.find((v) => v.isControl)!;

    // 1. Eligibility Check
    if (exp.eligibilityRules.allowedPlans && exp.eligibilityRules.allowedPlans.length > 0) {
      if (!context.plan || !exp.eligibilityRules.allowedPlans.includes(context.plan)) {
        return { variant: controlVariant, isEligible: false };
      }
    }

    if (exp.eligibilityRules.allowedCountries && exp.eligibilityRules.allowedCountries.length > 0) {
      if (!context.country || !exp.eligibilityRules.allowedCountries.includes(context.country)) {
        return { variant: controlVariant, isEligible: false };
      }
    }

    if (exp.eligibilityRules.minAccountAgeDays !== undefined) {
      if (
        context.accountAgeDays === undefined ||
        context.accountAgeDays < exp.eligibilityRules.minAccountAgeDays
      ) {
        return { variant: controlVariant, isEligible: false };
      }
    }

    // 2. Mutual Exclusion Check
    if (exp.mutualExclusionGroup) {
      const conflicting = await this.repository.getUserActiveAssignmentsInGroup(
        context.userId,
        exp.mutualExclusionGroup
      );
      const isOtherExp = conflicting.some((a) => a.experimentId !== exp.id);
      if (isOtherExp) {
        return { variant: controlVariant, isEligible: false };
      }
    }

    // 3. Persisted Assignment Check (prevent jumping between variants)
    const existing = await this.repository.getAssignment(exp.id, context.userId);
    if (existing) {
      const assignedVariant = exp.variants.find((v) => v.id === existing.variantId) || controlVariant;
      return { variant: assignedVariant, isEligible: true, assignment: existing };
    }

    // 4. Deterministic Consistent Hashing
    const bucket = this.hashToBucket(`${exp.id}:${context.userId}`);
    let cumulative = 0;
    let selectedVariant = controlVariant;

    for (const v of exp.variants) {
      cumulative += v.weight;
      if (bucket < cumulative) {
        selectedVariant = v;
        break;
      }
    }

    const assignment: VariantAssignment = {
      experimentId: exp.id,
      userId: context.userId,
      variantId: selectedVariant.id,
      assignedAt: new Date().toISOString(),
      exposed: false,
      exposedAt: null,
    };

    await this.repository.saveAssignment(assignment);
    return { variant: selectedVariant, isEligible: true, assignment };
  }

  async trackExposure(experimentKey: string, userId: string): Promise<void> {
    const exp = await this.repository.getExperimentByKey(experimentKey);
    if (!exp) return;

    const assignment = await this.repository.getAssignment(exp.id, userId);
    if (assignment && !assignment.exposed) {
      assignment.exposed = true;
      assignment.exposedAt = new Date().toISOString();
      await this.repository.updateAssignment(assignment);
    }
  }

  async trackConversion(params: {
    experimentKey: string;
    userId: string;
    metricName: string;
    value?: number;
  }): Promise<boolean> {
    const exp = await this.repository.getExperimentByKey(params.experimentKey);
    if (!exp) return false;

    const assignment = await this.repository.getAssignment(exp.id, params.userId);
    if (!assignment || !assignment.exposed || !assignment.exposedAt) {
      return false; // Only count conversions for users who were actually exposed
    }

    // Attribution window check
    const exposedTime = new Date(assignment.exposedAt).getTime();
    const windowMs = exp.attributionWindowHours * 3600000;
    if (Date.now() - exposedTime > windowMs) {
      return false; // Outside attribution window
    }

    const conversion: ConversionEvent = {
      id: randomUUID(),
      experimentId: exp.id,
      userId: params.userId,
      variantId: assignment.variantId,
      metricName: params.metricName,
      value: params.value ?? 1,
      timestamp: new Date().toISOString(),
    };

    await this.repository.saveConversion(conversion);
    return true;
  }

  async getResults(experimentKey: string): Promise<RawMetricsReport> {
    const exp = await this.repository.getExperimentByKey(experimentKey);
    if (!exp) {
      throw new Error(`Experiment '${experimentKey}' not found`);
    }

    const assignments = await this.repository.getAssignmentsForExperiment(exp.id);
    const conversions = await this.repository.getConversionsForExperiment(exp.id);

    const variantMetrics: RawVariantMetrics[] = exp.variants.map((v) => {
      const assigned = assignments.filter((a) => a.variantId === v.id);
      const exposed = assigned.filter((a) => a.exposed);
      const variantConversions = conversions.filter(
        (c) => c.variantId === v.id && c.metricName === exp.primaryMetric
      );

      const exposedCount = exposed.length;
      const conversionsCount = variantConversions.length;
      const conversionRate = exposedCount > 0 ? conversionsCount / exposedCount : 0;
      const standardError =
        exposedCount > 0 ? Math.sqrt((conversionRate * (1 - conversionRate)) / exposedCount) : 0;

      return {
        variantId: v.id,
        variantName: v.name,
        isControl: v.isControl,
        weight: v.weight,
        assignedCount: assigned.length,
        exposedCount,
        conversionsCount,
        conversionRate: Math.round(conversionRate * 10000) / 10000,
        standardError: Math.round(standardError * 10000) / 10000,
      };
    });

    // Sample-Ratio Mismatch (SRM) check via Chi-Square test
    const totalAssigned = assignments.length;
    let chiSquare = 0;
    if (totalAssigned >= 30) {
      for (const v of exp.variants) {
        const expected = totalAssigned * (v.weight / 100);
        const observed = assignments.filter((a) => a.variantId === v.id).length;
        if (expected > 0) {
          chiSquare += Math.pow(observed - expected, 2) / expected;
        }
      }
    }

    // Critical value for 1 degree of freedom at p=0.01 is 6.635
    const srmDetected = chiSquare > 6.635;

    return {
      experimentKey: exp.key,
      primaryMetric: exp.primaryMetric,
      srmDetected,
      variantMetrics,
      methodologyNote:
        "Results reflect raw observational data and conversion rates per exposed user. Statistical conclusions should account for variance and sample size without premature automated declarations.",
    };
  }
}
