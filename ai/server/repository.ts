import type {
  BackgroundJob,
  JobStatus,
  AIBudget,
  TokenUsage,
  AIProviderName
} from "../schemas/index.js";

export interface TokenUsageEntry {
  id: string;
  tenantId: string;
  userId: string;
  feature: string;
  provider: AIProviderName;
  model: string;
  usage: TokenUsage;
  idempotencyKey?: string;
  createdAt: Date;
}

export interface ToolExecutionLog {
  id: string;
  tenantId: string;
  userId: string;
  toolName: string;
  arguments: Record<string, any>;
  authorized: boolean;
  result?: any;
  error?: string;
  createdAt: Date;
}

export interface IAIRepository {
  recordUsage(entry: TokenUsageEntry): Promise<void>;
  getBudget(tenantId: string): Promise<AIBudget | null>;
  upsertBudget(budget: AIBudget): Promise<AIBudget>;
  incrementBudgetUsage(tenantId: string, costMicroCents: number): Promise<AIBudget>;
  setKillSwitch(tenantId: string, active: boolean): Promise<void>;
  getUsageSummary(tenantId: string): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCostMicroCents: number;
    requestCount: number;
  }>;

  createJob(job: BackgroundJob): Promise<BackgroundJob>;
  getJob(id: string): Promise<BackgroundJob | null>;
  getJobByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<BackgroundJob | null>;
  updateJob(id: string, updates: Partial<BackgroundJob>): Promise<BackgroundJob | null>;
  listJobs(tenantId?: string, status?: JobStatus): Promise<BackgroundJob[]>;


  logToolExecution(log: ToolExecutionLog): Promise<void>;
  getToolExecutionLogs(tenantId: string, limit?: number): Promise<ToolExecutionLog[]>;
}

export class InMemoryAIRepository implements IAIRepository {
  private usageEntries: TokenUsageEntry[] = [];
  private budgets = new Map<string, AIBudget>();
  private jobs = new Map<string, BackgroundJob>();
  private toolLogs: ToolExecutionLog[] = [];

  public async recordUsage(entry: TokenUsageEntry): Promise<void> {
    this.usageEntries.push({ ...entry });
  }

  public async getBudget(tenantId: string): Promise<AIBudget | null> {
    const b = this.budgets.get(tenantId);
    return b ? { ...b } : null;
  }

  public async upsertBudget(budget: AIBudget): Promise<AIBudget> {
    this.budgets.set(budget.tenantId, { ...budget });
    return { ...budget };
  }

  public async incrementBudgetUsage(
    tenantId: string,
    costMicroCents: number
  ): Promise<AIBudget> {
    let budget = this.budgets.get(tenantId);
    if (!budget) {
      budget = {
        tenantId,
        dailyMicroCentsLimit: 50_000_000, // $50/day
        monthlyMicroCentsLimit: 1_000_000_000, // $1000/month
        currentDailyMicroCents: 0,
        currentMonthlyMicroCents: 0,
        killSwitchActive: false
      };
    }

    budget.currentDailyMicroCents += costMicroCents;
    budget.currentMonthlyMicroCents += costMicroCents;

    // Trigger kill switch automatically if limits are exceeded
    if (
      budget.currentDailyMicroCents > budget.dailyMicroCentsLimit ||
      budget.currentMonthlyMicroCents > budget.monthlyMicroCentsLimit
    ) {
      budget.killSwitchActive = true;
    }

    this.budgets.set(tenantId, { ...budget });
    return { ...budget };
  }

  public async setKillSwitch(tenantId: string, active: boolean): Promise<void> {
    const budget = await this.getBudget(tenantId);
    if (budget) {
      budget.killSwitchActive = active;
      this.budgets.set(tenantId, budget);
    }
  }

  public async getUsageSummary(tenantId: string): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCostMicroCents: number;
    requestCount: number;
  }> {
    const tenantEntries = this.usageEntries.filter((e) => e.tenantId === tenantId);
    return tenantEntries.reduce(
      (acc, e) => {
        acc.totalPromptTokens += e.usage.promptTokens;
        acc.totalCompletionTokens += e.usage.completionTokens;
        acc.totalCostMicroCents += e.usage.estimatedCostMicroCents;
        acc.requestCount += 1;
        return acc;
      },
      {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCostMicroCents: 0,
        requestCount: 0
      }
    );
  }

  public async createJob(job: BackgroundJob): Promise<BackgroundJob> {
    this.jobs.set(job.id, { ...job });
    return { ...job };
  }

  public async getJob(id: string): Promise<BackgroundJob | null> {
    const j = this.jobs.get(id);
    return j ? { ...j } : null;
  }

  public async getJobByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string
  ): Promise<BackgroundJob | null> {
    for (const job of this.jobs.values()) {
      if (job.tenantId === tenantId && job.idempotencyKey === idempotencyKey) {
        return { ...job };
      }
    }
    return null;
  }

  public async updateJob(
    id: string,
    updates: Partial<BackgroundJob>
  ): Promise<BackgroundJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;

    const updated: BackgroundJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };
    this.jobs.set(id, updated);
    return { ...updated };
  }

  public async listJobs(tenantId?: string, status?: JobStatus): Promise<BackgroundJob[]> {
    return Array.from(this.jobs.values()).filter(
      (j) => (!tenantId || j.tenantId === tenantId) && (!status || j.status === status)
    );
  }


  public async logToolExecution(log: ToolExecutionLog): Promise<void> {
    this.toolLogs.push({ ...log });
  }

  public async getToolExecutionLogs(
    tenantId: string,
    limit = 50
  ): Promise<ToolExecutionLog[]> {
    return this.toolLogs
      .filter((l) => l.tenantId === tenantId)
      .slice(-limit);
  }
}
