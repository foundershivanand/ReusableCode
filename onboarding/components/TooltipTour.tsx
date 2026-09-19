import React, { useEffect, useState } from "react";
import type { TourTooltipPlacement } from "../schemas/onboarding-schemas.js";

export interface TooltipTourProps {
  targetSelector: string;
  title: string;
  content: string;
  placement?: TourTooltipPlacement;
  isOpen: boolean;
  onNext?: () => void;
  onClose?: () => void;
}

export const TooltipTour: React.FC<TooltipTourProps> = ({
  targetSelector,
  title,
  content,
  placement = "bottom",
  isOpen,
  onNext,
  onClose
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const el = document.querySelector(targetSelector);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    if (placement === "top") {
      top = rect.top + window.scrollY - 100;
    } else if (placement === "right") {
      top = rect.top + window.scrollY;
      left = rect.right + window.scrollX + 8;
    } else if (placement === "left") {
      top = rect.top + window.scrollY;
      left = rect.left + window.scrollX - 260;
    }

    setCoords({ top, left });
  }, [isOpen, targetSelector, placement]);

  if (!isOpen) return null;

  return (
    <div
      role="tooltip"
      aria-label={title}
      style={{
        top: coords ? `${coords.top}px` : "50%",
        left: coords ? `${coords.left}px` : "50%",
        position: coords ? "absolute" : "fixed"
      }}
      className="z-50 w-64 bg-gray-900 text-white p-3.5 rounded-lg shadow-xl text-xs"
    >
      <div className="flex items-center justify-between mb-1.5">
        <h5 className="font-semibold text-white">{title}</h5>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss tooltip"
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      <p className="text-gray-300 mb-3">{content}</p>
      <div className="flex justify-end space-x-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-gray-400 hover:text-white"
          >
            Dismiss
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded text-[11px]"
          >
            Got it →
          </button>
        )}
      </div>
    </div>
  );
};
