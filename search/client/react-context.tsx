import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SearchClient } from "./search-client.js";
import type { CommandItem, SearchResultItem } from "../schemas/search-schemas.js";

interface SearchContextValue {
  client: SearchClient;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  searchResults: SearchResultItem[];
  commands: CommandItem[];
  isLoading: boolean;
  error: string | null;
  executeCommand: (cmd: CommandItem) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export interface SearchProviderProps {
  client?: SearchClient;
  tenantId: string;
  userId: string;
  userRoles?: string[];
  onExecuteCommand?: (cmd: CommandItem) => void;
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({
  client = new SearchClient(),
  tenantId,
  userId,
  userRoles = [],
  onExecuteCommand,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global Cmd/Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch registered commands on mount
  useEffect(() => {
    client
      .getCommands()
      .then(setCommands)
      .catch((err) => setError(err.message));
  }, [client]);

  // Debounced search query
  const performSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const results = await client.search({
          tenantId,
          userId,
          userRoles,
          query: q,
          limit: 10
        });
        setSearchResults(results);
      } catch (err: any) {
        setError(err.message || "Search failed");
      } finally {
        setIsLoading(false);
      }
    },
    [client, tenantId, userId, userRoles]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, performSearch]);

  const executeCommand = (cmd: CommandItem) => {
    setIsOpen(false);
    onExecuteCommand?.(cmd);
  };

  return (
    <SearchContext.Provider
      value={{
        client,
        isOpen,
        setIsOpen,
        query,
        setQuery,
        searchResults,
        commands,
        isLoading,
        error,
        executeCommand
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextValue => {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return ctx;
};
