import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { FileRecord, StorageQuota } from "../schemas/index.js";
import { StorageClient } from "./storage-client.js";

interface StorageContextValue {
  client: StorageClient;
  files: FileRecord[];
  quota: StorageQuota | null;
  loading: boolean;
  error: Error | null;
  refreshFiles: () => Promise<void>;
  uploadFile: (file: File, visibility?: FileRecord["visibility"], onProgress?: (p: number) => void) => Promise<FileRecord>;
  deleteFile: (fileId: string) => Promise<void>;
}

const StorageReactContext = createContext<StorageContextValue | null>(null);

export interface StorageProviderProps {
  client: StorageClient;
  tenantId: string;
  userId: string;
  children: React.ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({ client, tenantId, userId, children }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const [list, q] = await Promise.all([
        client.listFiles(),
        client.getQuota()
      ]);
      setFiles(list);
      setQuota(q);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const uploadFile = async (
    file: File,
    visibility: FileRecord["visibility"] = "PRIVATE",
    onProgress?: (p: number) => void
  ): Promise<FileRecord> => {
    const presigned = await client.requestUpload({
      tenantId,
      userId,
      filename: file.name,
      sizeBytes: file.size,
      claimedMimeType: file.type || "application/octet-stream",
      visibility
    });

    await client.uploadFileDirect(file, presigned, onProgress);
    const completed = await client.completeUpload(presigned.fileId);
    await refreshFiles();
    return completed;
  };

  const deleteFile = async (fileId: string) => {
    await client.deleteFile(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    const q = await client.getQuota();
    setQuota(q);
  };

  return (
    <StorageReactContext.Provider
      value={{
        client,
        files,
        quota,
        loading,
        error,
        refreshFiles,
        uploadFile,
        deleteFile
      }}
    >
      {children}
    </StorageReactContext.Provider>
  );
};

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageReactContext);
  if (!ctx) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return ctx;
}
