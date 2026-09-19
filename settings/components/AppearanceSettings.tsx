import React, { useState } from "react";
import type { AppearanceSettings as Appearance, Theme } from "../schemas/index.js";

export interface AppearanceSettingsProps {
  initialAppearance: Appearance;
  onSave: (appearance: Partial<Appearance>) => Promise<void>;
  className?: string;
}

const THEME_OPTIONS: { id: Theme; label: string; desc: string }[] = [
  { id: "light", label: "Light", desc: "Clean, high-contrast light mode" },
  { id: "dark", label: "Dark", desc: "Easy on the eyes in low light" },
  { id: "system", label: "System", desc: "Automatically match device appearance" }
];

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  initialAppearance,
  onSave,
  className = ""
}) => {
  const [theme, setTheme] = useState<Theme>(initialAppearance.theme);
  const [accentColor, setAccentColor] = useState(initialAppearance.accentColor);
  const [reducedMotion, setReducedMotion] = useState(initialAppearance.reducedMotion);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ theme, accentColor, reducedMotion });
      setMessage({ type: "success", text: "Appearance updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update appearance" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Appearance & Theme</h3>
        <p className="text-xs text-gray-500">Customize visual appearance and accessibility preferences.</p>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <label
                key={opt.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors block ${
                  isSelected ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="appearanceTheme"
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => setTheme(opt.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 pl-6">{opt.desc}</p>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
          />
          <span className="text-xs text-gray-500">{accentColor}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-gray-700">Reduced Motion</span>
            <p className="text-xs text-gray-500">Minimize animations and smooth scrolling effects</p>
          </div>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Appearance"}
      </button>
    </form>
  );
};
