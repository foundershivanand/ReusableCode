import React, { createContext, useContext, useState, useCallback } from "react";
import { SupportClient } from "./support-client.js";
import type { SupportTicket, CreateTicketInput, TicketStatus } from "../schemas/support-schemas.js";

interface SupportContextValue {
  client: SupportClient;
  tickets: SupportTicket[];
  isLoading: boolean;
  error: string | null;
  submitTicket: (input: Omit<CreateTicketInput, "tenantId" | "userId" | "userEmail">) => Promise<SupportTicket>;
  updateStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  fetchTickets: (status?: string) => Promise<void>;
}

const SupportContext = createContext<SupportContextValue | null>(null);

export interface SupportProviderProps {
  client?: SupportClient;
  tenantId: string;
  userId: string;
  userEmail: string;
  children: React.ReactNode;
}

export const SupportProvider: React.FC<SupportProviderProps> = ({
  client = new SupportClient(),
  tenantId,
  userId,
  userEmail,
  children
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(
    async (status?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await client.listTickets(status);
        setTickets(data);
      } catch (err: any) {
        setError(err.message || "Failed to load support tickets");
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const submitTicket = async (
    input: Omit<CreateTicketInput, "tenantId" | "userId" | "userEmail">
  ): Promise<SupportTicket> => {
    try {
      setIsLoading(true);
      setError(null);
      const ticket = await client.createTicket({
        ...input,
        tenantId,
        userId,
        userEmail
      });
      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const updated = await client.updateTicketStatus(ticketId, status);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <SupportContext.Provider
      value={{
        client,
        tickets,
        isLoading,
        error,
        submitTicket,
        updateStatus,
        fetchTickets
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = (): SupportContextValue => {
  const ctx = useContext(SupportContext);
  if (!ctx) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return ctx;
};
