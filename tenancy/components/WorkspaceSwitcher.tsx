import React, { useState } from "react";
import type { Workspace } from "../schemas/index.js";

export interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  workspaces: Workspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspaceId,
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-48 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{current ? current.name : "Select Workspace"}</span>
        <svg className="w-4 h-4 ml-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707A1 1 0 014.293 8.293l5-5A1 1 0 0110 3zm0 14a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 14.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 17z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-56 mt-2 origin-top-left bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="listbox">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Workspaces
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => {
                  onSelectWorkspace(ws.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left ${
                  ws.id === currentWorkspaceId ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-100"
                }`}
                role="option"
                aria-selected={ws.id === currentWorkspaceId}
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === currentWorkspaceId && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
            {onCreateWorkspace && (
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateWorkspace();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                >
                  <span className="mr-2">+</span> Create New Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
