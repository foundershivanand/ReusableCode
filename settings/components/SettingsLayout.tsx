import React, { useState } from "react";

export interface SettingsTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingsLayoutProps {
  tabs?: SettingsTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}

const DEFAULT_TABS: SettingsTab[] = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy & Consent" },
  { id: "security", label: "Security" }
];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  tabs = DEFAULT_TABS,
  activeTab: controlledActiveTab,
  onTabChange,
  children,
  className = ""
}) => {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id || "profile");
  const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;

  const handleSelect = (id: string) => {
    setInternalTab(id);
    if (onTabChange) onTabChange(id);
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings & Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account profile, appearance, and privacy choices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.icon && <span className="mr-3">{tab.icon}</span>}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
};
