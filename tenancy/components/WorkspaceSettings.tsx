import React, { useState } from "react";
import type { Organization, Workspace } from "../schemas/index.js";

export interface WorkspaceSettingsProps {
  organization: Organization;
  workspace?: Workspace;
  canDeleteOrg?: boolean;
  onUpdateOrg?: (name: string, customDomain?: string) => Promise<void>;
  onDeleteOrg?: (confirmationSlug: string) => Promise<void>;
  className?: string;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({
  organization,
  canDeleteOrg = false,
  onUpdateOrg,
  onDeleteOrg,
  className = ""
}) => {
  const [name, setName] = useState(organization.name);
  const [customDomain, setCustomDomain] = useState(organization.customDomain || "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateOrg) return;
    setSaving(true);
    setMessage(null);
    try {
      await onUpdateOrg(name, customDomain.trim() || undefined);
      setMessage({ type: "success", text: "Settings updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteOrg || deleteConfirmation !== organization.slug) return;
    setDeleting(true);
    setMessage(null);
    try {
      await onDeleteOrg(deleteConfirmation);
      setMessage({ type: "success", text: "Organization marked for deletion. A 30-day grace period is now active." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete organization" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* General Settings */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Organization Settings</h3>
        <p className="text-sm text-gray-500 mb-4">Manage details and identifiers for this organization.</p>

        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Slug (URL identifier)</label>
            <input
              type="text"
              value={organization.slug}
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Slug cannot be changed once created.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (Optional)</label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="workspace.yourcompany.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {onUpdateOrg && (
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      {canDeleteOrg && (
        <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm">
          <h3 className="text-lg font-semibold text-red-600 mb-1">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">
            Deleting this organization initiates a 30-day grace period, after which all workspaces, members, and data will be permanently purged.
          </p>

          <div className="space-y-3">
            <p className="text-xs text-gray-600 font-medium">
              To confirm, type <span className="font-bold text-gray-900">{organization.slug}</span> below:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={organization.slug}
              className="w-full px-3 py-2 border border-red-300 rounded-md text-sm"
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteConfirmation !== organization.slug || deleting}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
            >
              {deleting ? "Deleting Organization..." : "Delete Organization"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
