import React, { useState } from "react";
import type { ProfileSettings as Profile } from "../schemas/index.js";

export interface ProfileSettingsProps {
  initialProfile: Profile;
  onSave: (profile: Partial<Profile>) => Promise<void>;
  className?: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  initialProfile,
  onSave,
  className = ""
}) => {
  const [name, setName] = useState(initialProfile.name);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [title, setTitle] = useState(initialProfile.title || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave({
        name,
        avatarUrl: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        title: title.trim() || undefined
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Personal Profile</h3>
        <p className="text-xs text-gray-500">Information visible to your team and collaborators.</p>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="A brief summary about yourself..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
};
