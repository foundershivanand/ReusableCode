import React from "react";
import { useFeatureFlag } from "../client/hooks.js";

export interface FeatureFlagBadgeProps {
  flagKey: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureFlagBadge: React.FC<FeatureFlagBadgeProps> = ({
  flagKey,
  fallback = null,
  children
}) => {
  const isEnabled = useFeatureFlag(flagKey);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
