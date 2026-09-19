import React from "react";
import type { SearchResultItem } from "../schemas/search-schemas.js";

export interface SearchResultsListProps {
  results: SearchResultItem[];
  selectedIndex: number;
  onSelect: (result: SearchResultItem) => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  selectedIndex,
  onSelect
}) => {
  if (results.length === 0) return null;

  return (
    <div className="py-2">
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        Database Search Results
      </div>
      <ul role="listbox" className="space-y-0.5">
        {results.map((res, i) => {
          const isSelected = i === selectedIndex;
          return (
            <li
              key={res.id}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(res)}
              className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between text-xs ${
                isSelected ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div>
                <div className="font-semibold flex items-center space-x-1.5">
                  <span>{res.title}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-gray-100 text-gray-500">
                    {res.type}
                  </span>
                </div>
                {res.snippet && (
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{res.snippet}</p>
                )}
              </div>
              <span className="text-[11px] text-blue-600 font-medium">Open →</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
