import React from "react";

export interface CommandShortcutBadgeProps {
  shortcut?: string;
}

export const CommandShortcutBadge: React.FC<CommandShortcutBadgeProps> = ({ shortcut }) => {
  if (!shortcut) return null;

  const parts = shortcut.split("+").map((s) => s.trim());

  return (
    <div className="flex items-center space-x-1">
      {parts.map((part, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-gray-100 text-gray-600 rounded border border-gray-200 shadow-2xs"
        >
          {part}
        </kbd>
      ))}
    </div>
  );
};
