import { BusinessRuleError } from "../errors/errors.js";

export type OwnerDeletionPolicy = "CASCADE_DELETE" | "ANONYMIZE" | "TRANSFER_OWNERSHIP" | "RETAIN";

export interface EntityLifecycleMetadata {
  ownerId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  retentionDays?: number; // undefined means retained indefinitely
  expiresAt?: string;
  exportable: boolean;
  deletable: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  ownerDeletionPolicy: OwnerDeletionPolicy;
}

export function initializeLifecycle(params: {
  ownerId: string;
  tenantId: string;
  retentionDays?: number;
  exportable?: boolean;
  deletable?: boolean;
  ownerDeletionPolicy?: OwnerDeletionPolicy;
}): EntityLifecycleMetadata {
  const now = new Date();
  const expiresAt = params.retentionDays
    ? new Date(now.getTime() + params.retentionDays * 86400000).toISOString()
    : undefined;

  return {
    ownerId: params.ownerId,
    tenantId: params.tenantId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    retentionDays: params.retentionDays,
    expiresAt,
    exportable: params.exportable ?? true,
    deletable: params.deletable ?? true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    ownerDeletionPolicy: params.ownerDeletionPolicy ?? "CASCADE_DELETE",
  };
}

export function softDeleteEntity<T extends { lifecycle: EntityLifecycleMetadata }>(
  entity: T,
  deletedBy: string
): T {
  if (!entity.lifecycle.deletable) {
    throw new BusinessRuleError("This entity is marked as non-deletable by regulatory or policy constraints.");
  }

  entity.lifecycle.isDeleted = true;
  entity.lifecycle.deletedAt = new Date().toISOString();
  entity.lifecycle.deletedBy = deletedBy;
  entity.lifecycle.updatedAt = new Date().toISOString();

  return entity;
}

export function isEntityExpired(entity: { lifecycle: EntityLifecycleMetadata }): boolean {
  if (!entity.lifecycle.expiresAt) return false;
  return new Date(entity.lifecycle.expiresAt).getTime() <= Date.now();
}

export function handleOwnerDeletionCascade<T extends { lifecycle: EntityLifecycleMetadata; [key: string]: any }>(
  entities: T[],
  deletedOwnerId: string,
  newOwnerId?: string
): T[] {
  const remaining: T[] = [];

  for (const entity of entities) {
    if (entity.lifecycle.ownerId !== deletedOwnerId) {
      remaining.push(entity);
      continue;
    }

    switch (entity.lifecycle.ownerDeletionPolicy) {
      case "CASCADE_DELETE":
        // Soft delete the entity
        softDeleteEntity(entity, `SYSTEM:OWNER_DELETED:${deletedOwnerId}`);
        remaining.push(entity);
        break;

      case "ANONYMIZE":
        entity.lifecycle.ownerId = "ANONYMIZED_USER";
        entity.lifecycle.updatedAt = new Date().toISOString();
        remaining.push(entity);
        break;

      case "TRANSFER_OWNERSHIP":
        if (!newOwnerId) {
          throw new BusinessRuleError("TRANSFER_OWNERSHIP policy requires newOwnerId");
        }
        entity.lifecycle.ownerId = newOwnerId;
        entity.lifecycle.updatedAt = new Date().toISOString();
        remaining.push(entity);
        break;

      case "RETAIN":
        remaining.push(entity);
        break;
    }
  }

  return remaining;
}

export function exportEntityData<T extends { lifecycle: EntityLifecycleMetadata }>(
  entities: T[]
): Partial<T>[] {
  return entities
    .filter((e) => !e.lifecycle.isDeleted && e.lifecycle.exportable)
    .map((e) => {
      const copy = { ...e };
      return copy;
    });
}
