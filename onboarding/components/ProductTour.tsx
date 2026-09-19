import React, { useEffect, useCallback } from "react";
import { useOnboarding } from "../client/react-context.js";
import type { TourStep } from "../schemas/onboarding-schemas.js";

export interface ProductTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  steps: propSteps,
  onComplete,
  onSkip,
  className = ""
}) => {
  const {
    activeTourStep,
    activeTourIndex,
    nextTourStep,
    prevTourStep,
    endTour,
    startTour
  } = useOnboarding();

  useEffect(() => {
    if (propSteps && propSteps.length > 0 && activeTourIndex === -1) {
      startTour(propSteps);
    }
  }, [propSteps, activeTourIndex, startTour]);

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!activeTourStep) return;
      if (e.key === "Escape") {
        endTour();
        onSkip?.();
      } else if (e.key === "ArrowRight") {
        nextTourStep();
      } else if (e.key === "ArrowLeft") {
        prevTourStep();
      }
    },
    [activeTourStep, endTour, nextTourStep, prevTourStep, onSkip]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!activeTourStep) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product Tour"
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
    >
      <div
        className={`pointer-events-auto max-w-sm w-full bg-white rounded-xl shadow-2xl p-5 border border-gray-100 ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            Step {activeTourIndex + 1}
          </span>
          <button
            type="button"
            onClick={() => {
              endTour();
              onSkip?.();
            }}
            aria-label="Close tour"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        <h4 className="text-base font-bold text-gray-900 mb-1">{activeTourStep.title}</h4>
        <p className="text-sm text-gray-600 mb-5">{activeTourStep.content}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={prevTourStep}
            disabled={activeTourIndex === 0}
            className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40"
          >
            ← Previous
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                endTour();
                onSkip?.();
              }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                nextTourStep();
                onComplete?.();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
