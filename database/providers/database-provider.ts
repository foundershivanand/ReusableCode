export interface BackupStorageProvider {
  uploadSnapshot(key: string, buffer: Buffer): Promise<{ location: string; size: number }>;
}

export class MockBackupStorageProvider implements BackupStorageProvider {
  async uploadSnapshot(key: string, buffer: Buffer): Promise<{ location: string; size: number }> {
    return {
      location: `s3://prod-backups-immutable-worm/${key}`,
      size: buffer.length,
    };
  }
}
