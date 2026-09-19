import { useState, useEffect, useCallback } from "react";
import { useTenancyContext } from "./react-context.js";
import type { Workspace, Member, TenantRole, TenantPermission, InviteMemberInput } from "../schemas/index.js";

export function useTenantContext() {
  const { context, loading, error, refreshContext, can } = useTenancyContext();
  return { context, loading, error, refreshContext, can };
}

export function usePermissions() {
  const { can, context } = useTenancyContext();
  const hasPermission = useCallback((permission: TenantPermission) => can(permission), [can]);
  return { hasPermission, role: context?.role, permissions: context?.permissions || [] };
}

export function useWorkspaces() {
  const { client } = useTenancyContext();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return { workspaces, loading, error, refetch: fetchWorkspaces };
}

export function useMembers() {
  const { client } = useTenancyContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.listMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = async (input: InviteMemberInput) => {
    await client.inviteMember(input);
    await fetchMembers();
  };

  const updateRole = async (memberId: string, role: TenantRole) => {
    await client.updateMemberRole(memberId, role);
    await fetchMembers();
  };

  const removeMember = async (memberId: string) => {
    await client.removeMember(memberId);
    await fetchMembers();
  };

  return { members, loading, error, refetch: fetchMembers, inviteMember, updateRole, removeMember };
}
