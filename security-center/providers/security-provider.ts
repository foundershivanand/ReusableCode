export interface SbomScanner {
  scanDependencies(): Promise<Array<{ packageName: string; version: string; vulnerable: boolean; cve?: string }>>;
}

export class MockSbomScanner implements SbomScanner {
  async scanDependencies(): Promise<Array<{ packageName: string; version: string; vulnerable: boolean; cve?: string }>> {
    return [
      { packageName: "zod", version: "3.22.4", vulnerable: false },
      { packageName: "react", version: "18.2.0", vulnerable: false },
    ];
  }
}
