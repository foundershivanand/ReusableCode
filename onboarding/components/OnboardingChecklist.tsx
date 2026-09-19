import React from "react";
import { useOnboarding } from "../client/react-context.js";
import type { OnboardingStep } from "../schemas/onboarding-schemas.js";

export interface OnboardingChecklistProps {
  title?: string;
  subtitle?: string;
  onStepClick?: (step: OnboardingStep) => void;
  className?: string;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  title = "Getting Started",
  subtitle = "Complete these steps to set up your account",
  onStepClick,
  className = ""
}) => {
  const { flow, state, steps, completeStep, skipFlow, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-lg bg-white shadow-sm animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!flow || steps.length === 0) return null;

  const progress = state?.progressPercentage || 0;
  const isCompleted = state?.status === "COMPLETED";
  const isSkipped = state?.status === "SKIPPED";

  if (isCompleted || isSkipped) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Onboarding Checklist"
      className={`border border-gray-200 rounded-xl p-5 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{flow.title || title}</h3>
        <span className="text-sm font-medium text-blue-600">{progress}% Completed</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">{flow.description || subtitle}</p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Steps List */}
      <ul className="space-y-3" role="list">
        {steps.map((step, idx) => {
          const stepState = state?.stepStates?.[step.id];
          const isDone = stepState?.status === "COMPLETED";
          const isCurrent = (state?.currentStepIndex || 0) === idx;

          return (
            <li
              key={step.id}
              className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                isDone
                  ? "bg-gray-50 border-gray-100 text-gray-500"
                  : isCurrent
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  type="button"
                  aria-label={isDone ? `Step ${step.title} completed` : `Mark ${step.title} complete`}
                  onClick={() => !isDone && completeStep(step.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-xs font-bold transition-colors ${
                    isDone
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-gray-400 hover:border-blue-600 text-transparent"
                  }`}
                >
                  ✓
                </button>
                <div>
                  <h4 className={`text-sm font-medium ${isDone ? "line-through text-gray-400" : ""}`}>
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {step.serverVerificationKey && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium"
                    title="Requires server verification"
                  >
                    Verified
                  </span>
                )}
                {step.actionUrl && !isDone && (
                  <a
                    href={step.actionUrl}
                    onClick={() => onStepClick?.(step)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Start →
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer / Skip Option */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={() => skipFlow("User chose to skip checklist")}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip onboarding for now
        </button>
      </div>
    </div>
  );
};
