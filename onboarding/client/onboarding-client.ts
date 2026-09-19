import type {
  OnboardingFlow,
  UserOnboardingState,
  OnboardingStep,
  CompleteStepInput,
  SkipFlowInput
} from "../schemas/onboarding-schemas.js";

export interface OnboardingClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class OnboardingClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: OnboardingClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/onboarding";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async getFlow(flowId: string): Promise<OnboardingFlow> {
    const res = await this.fetchFn(`${this.baseUrl}/flows/${flowId}`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch onboarding flow: ${res.statusText}`);
    return res.json();
  }

  async getVisibleSteps(flowId: string): Promise<OnboardingStep[]> {
    const res = await this.fetchFn(`${this.baseUrl}/flows/${flowId}/steps`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch visible steps: ${res.statusText}`);
    return res.json();
  }

  async getUserState(flowId: string): Promise<UserOnboardingState> {
    const res = await this.fetchFn(`${this.baseUrl}/flows/${flowId}/state`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch user state: ${res.statusText}`);
    return res.json();
  }

  async startOrResume(flowId: string): Promise<UserOnboardingState> {
    const res = await this.fetchFn(`${this.baseUrl}/flows/${flowId}/start`, {
      method: "POST",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to start onboarding: ${res.statusText}`);
    return res.json();
  }

  async completeStep(input: CompleteStepInput): Promise<UserOnboardingState> {
    const res = await this.fetchFn(`${this.baseUrl}/steps/complete`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to complete step: ${res.statusText}`);
    return res.json();
  }

  async skipFlow(input: SkipFlowInput): Promise<UserOnboardingState> {
    const res = await this.fetchFn(`${this.baseUrl}/flows/skip`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to skip onboarding flow: ${res.statusText}`);
    return res.json();
  }
}
