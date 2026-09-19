import { useSupport } from "./react-context.js";

export { useSupport };

export function useSupportTickets() {
  const { tickets, isLoading, error, fetchTickets, updateStatus } = useSupport();
  return { tickets, isLoading, error, fetchTickets, updateStatus };
}
