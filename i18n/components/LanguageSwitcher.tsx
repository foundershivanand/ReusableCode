import React from "react";
import { useLocale } from "../client/hooks.js";

export interface LanguageSwitcherProps {
  className?: string;
  style?: React.CSSProperties;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  style,
}) => {
  const { locale, setLocale, locales } = useLocale();

  return (
    <div
      role="region"
      aria-label="Language selector"
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      <label htmlFor="language-select" style={{ display: "none" }}>
        Select Language
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label="Change language"
        style={{
          padding: "0.375rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          backgroundColor: "#ffffff",
          fontSize: "0.875rem",
          color: "#374151",
          cursor: "pointer",
        }}
      >
        {locales.length > 0 ? (
          locales.map((loc) => (
            <option key={loc.code} value={loc.code}>
              {loc.nativeName} ({loc.name})
            </option>
          ))
        ) : (
          <>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="he">עברית (Hebrew)</option>
            <option value="de">Deutsch</option>
          </>
        )}
      </select>
    </div>
  );
};
