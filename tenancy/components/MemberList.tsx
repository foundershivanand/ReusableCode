import React from "react";
import type { Member, TenantRole } from "../schemas/index.js";

export interface MemberListProps {
  members: Member[];
  currentUserId: string;
  canManageMembers?: boolean;
  onUpdateRole?: (memberId: string, role: TenantRole) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onSuspendMember?: (memberId: string) => Promise<void>;
  className?: string;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUserId,
  canManageMembers = false,
  onUpdateRole,
  onRemoveMember,
  onSuspendMember,
  className = ""
}) => {
  return (
    <div className={`overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Team Members</h3>
        <p className="text-xs text-gray-500">Manage who has access to this workspace and their permission levels.</p>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Role</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Joined</th>
            {canManageMembers && (
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            return (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      {member.userId.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {member.userId} {isSelf && <span className="text-xs text-gray-500">(You)</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {canManageMembers && !isSelf && member.role !== "OWNER" && onUpdateRole ? (
                    <select
                      value={member.role}
                      onChange={(e) => onUpdateRole(member.id, e.target.value as TenantRole)}
                      className="text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.role === "OWNER" ? "bg-purple-100 text-purple-800" :
                      member.role === "ADMIN" ? "bg-blue-100 text-blue-800" :
                      member.role === "MEMBER" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {member.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                    member.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </td>
                {canManageMembers && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                    {!isSelf && member.role !== "OWNER" && (
                      <>
                        {onSuspendMember && (
                          <button
                            type="button"
                            onClick={() => onSuspendMember(member.id)}
                            className="text-amber-600 hover:text-amber-900"
                          >
                            {member.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                          </button>
                        )}
                        {onRemoveMember && (
                          <button
                            type="button"
                            onClick={() => onRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
