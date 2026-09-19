import React from "react";
import type { TenantRole } from "../schemas/index.js";

export interface RoleSelectorProps {
  value: TenantRole;
  onChange: (role: TenantRole) => void;
  allowedRoles?: TenantRole[];
  disabled?: boolean;
}

const ROLE_DESCRIPTIONS: Record<TenantRole, { label: string; desc: string }> = {
  OWNER: { label: "Owner", desc: "Full administrative and billing control" },
  ADMIN: { label: "Admin", desc: "Can manage members, workspaces, and settings" },
  MEMBER: { label: "Member", desc: "Can view and participate in workspaces" },
  VIEWER: { label: "Viewer", desc: "Read-only access to workspaces and content" }
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  allowedRoles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      {allowedRoles.map((role) => {
        const info = ROLE_DESCRIPTIONS[role];
        const isSelected = value === role;
        return (
          <label
            key={role}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
              isSelected ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="tenantRole"
              value={role}
              checked={isSelected}
              onChange={() => !disabled && onChange(role)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3 text-sm">
              <span className="font-medium text-gray-900">{info.label}</span>
              <p className="text-gray-500 text-xs">{info.desc}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
};
