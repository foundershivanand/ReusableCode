import React, { useEffect, useState } from "react";
import { useSupport } from "../client/react-context.js";
import type { TicketStatus } from "../schemas/support-schemas.js";

export const AdminSupportDashboard: React.FC = () => {
  const { tickets, isLoading, error, fetchTickets, updateStatus } = useSupport();
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchTickets(statusFilter || undefined);
  }, [fetchTickets, statusFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Support Operations Dashboard</h3>
          <p className="text-xs text-gray-500">Manage user feedback, bug reports, and SLA states</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border rounded-lg bg-gray-50"
        >
          <option value="">All Statuses</option>
          <option value="CREATED">CREATED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="FIRST_RESPONSE">FIRST_RESPONSE</option>
          <option value="PENDING_CUSTOMER">PENDING_CUSTOMER</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading tickets...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No tickets found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="py-4 flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-xs text-gray-900">{ticket.subject}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                      {ticket.type}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{ticket.description}</p>
                  <div className="text-[10px] text-gray-400 flex items-center space-x-3">
                    <span>User: {ticket.userEmail}</span>
                    <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                    {ticket.firstResponseAt && (
                      <span>First Response: {new Date(ticket.firstResponseAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value as TicketStatus)}
                    className="text-xs px-2 py-1 border rounded bg-white"
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="FIRST_RESPONSE">FIRST_RESPONSE</option>
                    <option value="PENDING_CUSTOMER">PENDING_CUSTOMER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REOPENED">REOPENED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
