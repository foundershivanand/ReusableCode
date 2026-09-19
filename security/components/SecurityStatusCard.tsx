import React from "react";
import type { SecurityHeaders } from "../schemas/index.js";

export interface SecurityStatusCardProps {
  headers: SecurityHeaders;
  className?: string;
}

export const SecurityStatusCard: React.FC<SecurityStatusCardProps> = ({ headers, className = "" }) => {
  const checks = [
    { label: "Content Security Policy (CSP)", value: headers.contentSecurityPolicy ? "Active" : "Disabled", status: "ok" },
    { label: "Strict-Transport-Security (HSTS)", value: headers.strictTransportSecurity ? "Enabled (2yr)" : "Disabled", status: "ok" },
    { label: "Frame Protection (Clickjacking)", value: headers.xFrameOptions, status: "ok" },
    { label: "MIME Sniffing Protection", value: headers.xContentTypeOptions, status: "ok" },
    { label: "Referrer Policy", value: headers.referrerPolicy, status: "ok" },
    { label: "Permissions Policy", value: headers.permissionsPolicy ? "Restricted" : "Unrestricted", status: "ok" }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">🛡️</span>
        <h3 className="text-base font-bold text-gray-900">Active Security Posture</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {checks.map((c) => (
          <div key={c.label} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">{c.label}</span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800">
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
