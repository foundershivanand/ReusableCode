import type { OnboardingFlow, UserOnboardingState } from "../schemas/onboarding-schemas.js";

export interface IOnboardingRepository {
  getFlow(flowId: string): Promise<OnboardingFlow | null>;
  saveFlow(flow: OnboardingFlow): Promise<OnboardingFlow>;
  listFlows(productKey?: string): Promise<OnboardingFlow[]>;
  getUserState(userId: string, flowId: string): Promise<UserOnboardingState | null>;
  saveUserState(state: UserOnboardingState): Promise<UserOnboardingState>;
  deleteUserState(userId: string, flowId: string): Promise<void>;
  listUserStates(userId: string): Promise<UserOnboardingState[]>;
}

export class InMemoryOnboardingRepository implements IOnboardingRepository {
  private flows: Map<string, OnboardingFlow> = new Map();
  private userStates: Map<string, UserOnboardingState> = new Map();

  private getUserKey(userId: string, flowId: string): string {
    return `${userId}:${flowId}`;
  }

  async getFlow(flowId: string): Promise<OnboardingFlow | null> {
    return this.flows.get(flowId) || null;
  }

  async saveFlow(flow: OnboardingFlow): Promise<OnboardingFlow> {
    this.flows.set(flow.id, { ...flow, updatedAt: new Date() });
    return this.flows.get(flow.id)!;
  }

  async listFlows(productKey?: string): Promise<OnboardingFlow[]> {
    const all = Array.from(this.flows.values());
    if (!productKey) return all;
    return all.filter((f) => f.productKey === productKey);
  }

  async getUserState(userId: string, flowId: string): Promise<UserOnboardingState | null> {
    const key = this.getUserKey(userId, flowId);
    const state = this.userStates.get(key);
    return state ? JSON.parse(JSON.stringify(state)) : null;
  }

  async saveUserState(state: UserOnboardingState): Promise<UserOnboardingState> {
    const key = this.getUserKey(state.userId, state.flowId);
    const updated = { ...state, updatedAt: new Date() };
    this.userStates.set(key, JSON.parse(JSON.stringify(updated)));
    return updated;
  }

  async deleteUserState(userId: string, flowId: string): Promise<void> {
    const key = this.getUserKey(userId, flowId);
    this.userStates.delete(key);
  }

  async listUserStates(userId: string): Promise<UserOnboardingState[]> {
    const results: UserOnboardingState[] = [];
    for (const [key, state] of this.userStates.entries()) {
      if (key.startsWith(`${userId}:`)) {
        results.push(JSON.parse(JSON.stringify(state)));
      }
    }
    return results;
  }
}
