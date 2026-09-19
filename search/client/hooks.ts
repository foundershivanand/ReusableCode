import { useSearch } from "./react-context.js";

export { useSearch };

export function useCommandPalette() {
  const { isOpen, setIsOpen, query, setQuery, searchResults, commands, isLoading, executeCommand } =
    useSearch();
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    query,
    setQuery,
    searchResults,
    commands,
    isLoading,
    executeCommand
  };
}
