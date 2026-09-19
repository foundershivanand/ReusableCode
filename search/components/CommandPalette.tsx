import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearch } from "../client/react-context.js";
import { SearchResultsList } from "./SearchResultsList.js";
import { CommandShortcutBadge } from "./CommandShortcutBadge.js";
import type { CommandItem, SearchResultItem } from "../schemas/search-schemas.js";

export const CommandPalette: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    commands,
    searchResults,
    isLoading,
    executeCommand
  } = useSearch();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [destructivePromptCmd, setDestructivePromptCmd] = useState<CommandItem | null>(null);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const allSelectableItems = useMemo(() => {
    return [
      ...filteredCommands.map((c) => ({ type: "COMMAND" as const, item: c })),
      ...searchResults.map((r) => ({ type: "SEARCH_RESULT" as const, item: r }))
    ];
  }, [filteredCommands, searchResults]);

  // Reset selectedIndex when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allSelectableItems.length]);

  const handleSelectItem = (entry: { type: "COMMAND"; item: CommandItem } | { type: "SEARCH_RESULT"; item: SearchResultItem }) => {
    if (entry.type === "COMMAND") {
      if (entry.item.isDestructive) {
        setDestructivePromptCmd(entry.item);
      } else {
        executeCommand(entry.item);
      }
    } else {
      setIsOpen(false);
      if (typeof window !== "undefined") {
        window.location.href = entry.item.url;
      }
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        if (destructivePromptCmd) {
          setDestructivePromptCmd(null);
        } else {
          setIsOpen(false);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < allSelectableItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allSelectableItems.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allSelectableItems[selectedIndex];
        if (selected) {
          handleSelectItem(selected);
        }
      }
    },
    [isOpen, allSelectableItems, selectedIndex, destructivePromptCmd, setIsOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <span className="text-gray-400 mr-2.5 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            autoFocus
            className="w-full text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          {isLoading && <span className="text-xs text-gray-400 animate-spin">⏳</span>}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close command palette"
            className="ml-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Esc
          </button>
        </div>

        {/* Destructive Action Confirmation Modal */}
        {destructivePromptCmd ? (
          <div className="p-6 bg-red-50 text-center space-y-3">
            <h4 className="text-sm font-bold text-red-900">Confirm Destructive Action</h4>
            <p className="text-xs text-red-700">
              Are you sure you want to execute{" "}
              <span className="font-semibold">{destructivePromptCmd.title}</span>? This action cannot
              be undone.
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDestructivePromptCmd(null)}
                className="px-3 py-1.5 text-xs text-gray-600 bg-white border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  executeCommand(destructivePromptCmd);
                  setDestructivePromptCmd(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded shadow-sm"
              >
                Confirm & Run
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 p-2">
            {/* Commands Section */}
            {filteredCommands.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Commands & Actions
                </div>
                <ul role="listbox" className="space-y-0.5">
                  {filteredCommands.map((cmd, i) => {
                    const isSelected = i === selectedIndex;
                    return (
                      <li
                        key={cmd.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectItem({ type: "COMMAND", item: cmd })}
                        className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between text-xs ${
                          isSelected ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{cmd.title}</span>
                          {cmd.isDestructive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                              Destructive
                            </span>
                          )}
                        </div>
                        <CommandShortcutBadge shortcut={cmd.shortcut} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Database Search Results */}
            <SearchResultsList
              results={searchResults}
              selectedIndex={selectedIndex - filteredCommands.length}
              onSelect={(res) => handleSelectItem({ type: "SEARCH_RESULT", item: res })}
            />

            {allSelectableItems.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">
                No matching commands or search results found.
              </div>
            )}
          </div>
        )}

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Cmd / Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
