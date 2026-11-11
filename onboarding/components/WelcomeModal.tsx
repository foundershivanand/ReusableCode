import React, { useEffect, useCallback } from "react";

export interface WelcomeModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  benefits?: string[];
  primaryActionText?: string;
  secondaryActionText?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  onClose?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  title = "Welcome to your new workspace!",
  subtitle = "We're excited to have you on board. Follow this quick guide to get started in minutes.",
  benefits = [
    "Set up your profile and brand preferences",
    "Invite team members and configure roles",
    "Launch your first project with one click"
  ],
  primaryActionText = "Start Onboarding Guide",
  secondaryActionText = "I'll explore on my own",
  onPrimaryAction,
  onSecondaryAction,
  onClose
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center relative animate-in fade-in zoom-in-95 duration-200">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg p-1"
          >
            ✕
          </button>
        )}

        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🚀
        </div>

        <h3 id="welcome-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{subtitle}</p>

        {benefits.length > 0 && (
          <ul className="text-left bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 space-y-2.5">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center text-xs sm:text-sm text-gray-700">
                <span className="text-green-500 mr-2 font-bold">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="order-2 sm:order-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {secondaryActionText}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimaryAction}
            className="order-1 sm:order-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow transition-colors"
          >
            {primaryActionText} →
          </button>
        </div>
      </div>
    </div>
  );
};
