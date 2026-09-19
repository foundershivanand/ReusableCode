import {
  Experiment,
  VariantAssignment,
  ConversionEvent,
} from "../schemas/experiment-schemas.js";

export interface ExperimentationRepository {
  getExperimentById(id: string): Promise<Experiment | null>;
  getExperimentByKey(key: string): Promise<Experiment | null>;
  listExperiments(options?: { status?: string }): Promise<Experiment[]>;
  saveExperiment(experiment: Experiment): Promise<void>;
  getAssignment(experimentId: string, userId: string): Promise<VariantAssignment | null>;
  saveAssignment(assignment: VariantAssignment): Promise<void>;
  updateAssignment(assignment: VariantAssignment): Promise<void>;
  getUserActiveAssignmentsInGroup(userId: string, group: string): Promise<VariantAssignment[]>;
  saveConversion(conversion: ConversionEvent): Promise<void>;
  getAssignmentsForExperiment(experimentId: string): Promise<VariantAssignment[]>;
  getConversionsForExperiment(experimentId: string): Promise<ConversionEvent[]>;
}

export class InMemoryExperimentationRepository implements ExperimentationRepository {
  private experiments = new Map<string, Experiment>();
  private assignments = new Map<string, VariantAssignment>(); // key: `${experimentId}:${userId}`
  private conversions: ConversionEvent[] = [];

  async getExperimentById(id: string): Promise<Experiment | null> {
    const exp = this.experiments.get(id);
    return exp ? { ...exp } : null;
  }

  async getExperimentByKey(key: string): Promise<Experiment | null> {
    for (const exp of this.experiments.values()) {
      if (exp.key === key) return { ...exp };
    }
    return null;
  }

  async listExperiments(options?: { status?: string }): Promise<Experiment[]> {
    return Array.from(this.experiments.values())
      .filter((e) => (!options?.status ? true : e.status === options.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveExperiment(experiment: Experiment): Promise<void> {
    this.experiments.set(experiment.id, { ...experiment });
  }

  async getAssignment(experimentId: string, userId: string): Promise<VariantAssignment | null> {
    const a = this.assignments.get(`${experimentId}:${userId}`);
    return a ? { ...a } : null;
  }

  async saveAssignment(assignment: VariantAssignment): Promise<void> {
    this.assignments.set(`${assignment.experimentId}:${assignment.userId}`, { ...assignment });
  }

  async updateAssignment(assignment: VariantAssignment): Promise<void> {
    this.assignments.set(`${assignment.experimentId}:${assignment.userId}`, { ...assignment });
  }

  async getUserActiveAssignmentsInGroup(userId: string, group: string): Promise<VariantAssignment[]> {
    const results: VariantAssignment[] = [];
    for (const a of this.assignments.values()) {
      if (a.userId === userId) {
        const exp = this.experiments.get(a.experimentId);
        if (exp && exp.status === "RUNNING" && exp.mutualExclusionGroup === group) {
          results.push({ ...a });
        }
      }
    }
    return results;
  }

  async saveConversion(conversion: ConversionEvent): Promise<void> {
    this.conversions.push({ ...conversion });
  }

  async getAssignmentsForExperiment(experimentId: string): Promise<VariantAssignment[]> {
    return Array.from(this.assignments.values())
      .filter((a) => a.experimentId === experimentId)
      .map((a) => ({ ...a }));
  }

  async getConversionsForExperiment(experimentId: string): Promise<ConversionEvent[]> {
    return this.conversions
      .filter((c) => c.experimentId === experimentId)
      .map((c) => ({ ...c }));
  }
}
