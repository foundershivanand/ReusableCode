import React from "react";
import { useAIChat } from "../client/hooks.js";
import type { PromptMessage } from "../schemas/index.js";

export interface AIChatProps {
  initialMessages?: PromptMessage[];
  placeholder?: string;
}

export const AIChat: React.FC<AIChatProps> = ({
  initialMessages,
  placeholder = "Ask the AI assistant..."
}) => {
  const { messages, input, setInput, sendMessage, isLoading, error } = useAIChat(initialMessages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h3>
        {isLoading && <span className="text-xs text-blue-500 animate-pulse">Generating response...</span>}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-8">
            No conversation yet. Send a message to start!
          </p>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === "UNTRUSTED_USER";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] uppercase font-semibold text-gray-400 mb-1 px-1">
                {m.role}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </form>
    </div>
  );
};
