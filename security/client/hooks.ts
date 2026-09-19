import { useSecurity } from "./react-context.js";

export function useRateLimitModal() {
  const { rateLimitModal, triggerRateLimitModal, closeRateLimitModal } = useSecurity();
  return {
    isOpen: rateLimitModal?.isOpen || false,
    retryAfterSeconds: rateLimitModal?.retryAfterSeconds || 0,
    trigger: triggerRateLimitModal,
    close: closeRateLimitModal
  };
}
