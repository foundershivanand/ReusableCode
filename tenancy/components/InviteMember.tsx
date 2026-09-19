import React, { useState } from "react";
import type { TenantRole, InviteMemberInput } from "../schemas/index.js";
import { RoleSelector } from "./RoleSelector.js";

export interface InviteMemberProps {
  organizationId: string;
  workspaceId?: string;
  onInvite: (input: InviteMemberInput) => Promise<void>;
  allowedRoles?: TenantRole[];
  className?: string;
}

export const InviteMember: React.FC<InviteMemberProps> = ({
  organizationId,
  workspaceId,
  onInvite,
  allowedRoles = ["ADMIN", "MEMBER", "VIEWER"],
  className = ""
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TenantRole>("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onInvite({
        organizationId,
        workspaceId,
        email,
        role
      });
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Invite Team Member</h3>
      <p className="text-sm text-gray-500 mb-4">Send an invitation to collaborate in this workspace.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
          Invitation sent successfully!
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <RoleSelector value={role} onChange={setRole} allowedRoles={allowedRoles} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Sending Invitation..." : "Send Invitation"}
        </button>
      </div>
    </form>
  );
};
