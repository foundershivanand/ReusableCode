import React, { useState } from "react";

export interface SecuritySettingsProps {
  mfaEnabled?: boolean;
  onEnableMfa?: () => Promise<void>;
  onDisableMfa?: () => Promise<void>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  className?: string;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  mfaEnabled = false,
  onEnableMfa,
  onDisableMfa,
  onChangePassword,
  className = ""
}) => {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onChangePassword) return;
    setSavingPass(true);
    setPassMessage(null);
    try {
      await onChangePassword(currentPass, newPass);
      setPassMessage({ type: "success", text: "Password changed successfully." });
      setCurrentPass("");
      setNewPass("");
    } catch (err) {
      setPassMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change password" });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* MFA Management */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication (2FA)</h3>
        <p className="text-xs text-gray-500 mb-4">Add an extra layer of security using an authenticator app (TOTP).</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${mfaEnabled ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="text-sm font-medium text-gray-700">
              {mfaEnabled ? "2FA is currently enabled" : "2FA is not enabled"}
            </span>
          </div>
          {mfaEnabled ? (
            onDisableMfa && (
              <button
                type="button"
                onClick={onDisableMfa}
                className="py-1.5 px-3 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium rounded-md"
              >
                Disable 2FA
              </button>
            )
          ) : (
            onEnableMfa && (
              <button
                type="button"
                onClick={onEnableMfa}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md"
              >
                Enable 2FA
              </button>
            )
          )}
        </div>
      </div>

      {/* Password Change */}
      {onChangePassword && (
        <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>

          {passMessage && (
            <div className={`p-3 rounded text-sm ${
              passMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {passMessage.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={savingPass}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
          >
            {savingPass ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
};
