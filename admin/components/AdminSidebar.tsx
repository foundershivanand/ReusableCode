import React from "react";

export interface AdminSidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  adminName?: string;
  adminRole?: string;
  className?: string;
}

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "organizations", label: "Organizations", icon: "🏢" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "usage", label: "Usage", icon: "📈" },
  { id: "jobs", label: "Jobs", icon: "⚙️" },
  { id: "webhooks", label: "Webhooks", icon: "🔗" },
  { id: "analytics", label: "Analytics", icon: "📉" },
  { id: "security", label: "Security", icon: "🛡️" },
  { id: "audit_logs", label: "Audit Logs", icon: "📜" },
  { id: "support", label: "Support", icon: "💬" },
  { id: "feature_flags", label: "Feature Flags", icon: "🚩" },
  { id: "system", label: "System", icon: "🖥️" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onSelectSection,
  adminName,
  adminRole,
  className = ""
}) => {
  return (
    <aside className={`w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col ${className}`}>
      {/* Brand */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-base tracking-wider uppercase">Admin Ops</span>
          <span className="block text-xs text-gray-500">Product Control Plane</span>
        </div>
        <span className="px-2 py-0.5 text-xs bg-red-900/60 text-red-300 border border-red-800 rounded font-mono">
          INTERNAL
        </span>
      </div>

      {/* Admin User Info */}
      {adminName && (
        <div className="px-4 py-3 bg-gray-800/40 border-b border-gray-800 text-xs">
          <div className="text-white font-medium truncate">{adminName}</div>
          <div className="text-gray-400 font-mono text-[11px]">{adminRole || "SUPER_ADMIN"}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                isActive
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="mr-2.5 text-sm">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
