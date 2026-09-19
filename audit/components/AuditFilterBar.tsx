import React from "react";
import { useAudit } from "../client/react-context.js";

export const AuditFilterBar: React.FC = () => {
  const { filter, setFilter, refresh } = useAudit();

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter((prev) => ({
      ...prev,
      action: e.target.value || undefined,
      cursor: undefined
    }));
  };

  const handleActorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter((prev) => ({
      ...prev,
      actorType: (e.target.value as any) || undefined,
      cursor: undefined
    }));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 flex flex-wrap gap-3 items-center justify-between text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Action</label>
          <select
            value={filter.action || ""}
            onChange={handleActionChange}
            className="px-2.5 py-1.5 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
            <option value="PLAN_CHANGED">PLAN_CHANGED</option>
            <option value="PROJECT_CREATED">PROJECT_CREATED</option>
            <option value="PROJECT_DELETED">PROJECT_DELETED</option>
            <option value="MEMBER_INVITED">MEMBER_INVITED</option>
            <option value="API_KEY_CREATED">API_KEY_CREATED</option>
            <option value="ADMIN_IMPERSONATION">ADMIN_IMPERSONATION</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Actor Type</label>
          <select
            value={filter.actorType || ""}
            onChange={handleActorTypeChange}
            className="px-2.5 py-1.5 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Actors</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="WORKER">WORKER</option>
            <option value="API_KEY">API_KEY</option>
            <option value="AI_AGENT">AI_AGENT</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => refresh()}
        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
      >
        Refresh Logs
      </button>
    </div>
  );
};
