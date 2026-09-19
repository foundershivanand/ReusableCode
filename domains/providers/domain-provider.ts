import { DnsResolverAdapter } from "../server/domain-service.js";

export class MockDnsResolver implements DnsResolverAdapter {
  private txtRecords = new Map<string, string[]>();
  private cnameRecords = new Map<string, string[]>();

  setTxtRecord(name: string, values: string[]) {
    this.txtRecords.set(name.toLowerCase(), values);
  }

  setCnameRecord(name: string, values: string[]) {
    this.cnameRecords.set(name.toLowerCase(), values);
  }

  async resolveTxt(name: string): Promise<string[]> {
    return this.txtRecords.get(name.toLowerCase()) || [];
  }

  async resolveCname(name: string): Promise<string[]> {
    return this.cnameRecords.get(name.toLowerCase()) || [];
  }
}
