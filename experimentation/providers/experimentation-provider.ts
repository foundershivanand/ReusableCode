import { ConversionEvent, VariantAssignment } from "../schemas/experiment-schemas.js";

export interface ExperimentEventExporter {
  exportExposure(assignment: VariantAssignment): Promise<void>;
  exportConversion(conversion: ConversionEvent): Promise<void>;
}

export class MockExperimentEventExporter implements ExperimentEventExporter {
  public exposures: VariantAssignment[] = [];
  public conversions: ConversionEvent[] = [];

  async exportExposure(assignment: VariantAssignment): Promise<void> {
    this.exposures.push(assignment);
  }

  async exportConversion(conversion: ConversionEvent): Promise<void> {
    this.conversions.push(conversion);
  }
}
