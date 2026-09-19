export interface StatusProbe {
  checkHealth(): Promise<{ status: "HEALTHY" | "DEGRADED" | "DOWN"; latencyMs: number }>;
}

export class DefaultStatusProbe implements StatusProbe {
  async checkHealth(): Promise<{ status: "HEALTHY" | "DEGRADED" | "DOWN"; latencyMs: number }> {
    return {
      status: "HEALTHY",
      latencyMs: 12,
    };
  }
}
