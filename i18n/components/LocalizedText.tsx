import React from "react";
import { useTranslation } from "../client/hooks.js";

export interface LocalizedTextProps {
  i18nKey: string;
  variables?: Record<string, string | number>;
  count?: number;
  defaultText?: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

export const LocalizedText: React.FC<LocalizedTextProps> = ({
  i18nKey,
  variables,
  count,
  defaultText,
  as: Component = "span",
  className,
  style,
}) => {
  const { t } = useTranslation();
  const translated = t(i18nKey, variables, count);
  const content = translated === i18nKey && defaultText ? defaultText : translated;

  return (
    <Component className={className} style={style}>
      {content}
    </Component>
  );
};
