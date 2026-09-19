import { useState, useEffect, useCallback } from "react";
import { useAIContext } from "./react-context.js";
import type { PromptMessage, AIBudget, BackgroundJob } from "../schemas/index.js";



export function useAIChat(initialMessages: PromptMessage[] = []) {
  const client = useAIContext();
  const [messages, setMessages] = useState<PromptMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: PromptMessage = {
        role: "UNTRUSTED_USER",
        content: text.trim()
      };

      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const res = await client.generateText({
          tenantId: "current",
          userId: "current",
          messages: updated
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "SYSTEM",
            content: res.text
          }
        ]);
      } catch (err: any) {
        setError(err?.message || "Failed to generate AI response");
      } finally {
        setIsLoading(false);
      }
    },
    [client, messages, isLoading]
  );

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    error
  };
}

export function useAIUsage() {
  const client = useAIContext();
  const [budget, setBudget] = useState<AIBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getBudget();
      setBudget(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch AI budget");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return {
    budget,
    loading,
    error,
    refresh: fetchBudget
  };
}

export function useAIJob(jobId: string) {
  const client = useAIContext();
  const [job, setJob] = useState<BackgroundJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const jobs = await client.listJobs();
      const matched = jobs.find((j) => j.id === jobId);
      if (matched) {
        setJob(matched);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [client, jobId]);

  const cancel = useCallback(async () => {
    if (!jobId) return;
    try {
      await client.cancelJob(jobId);
      await fetchJob();
    } catch (err: any) {
      setError(err?.message || "Failed to cancel job");
    }
  }, [client, jobId, fetchJob]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(() => {
      if (job && (job.status === "COMPLETED" || job.status === "DEAD_LETTER" || job.status === "CANCELLED")) {
        clearInterval(interval);
      } else {
        fetchJob();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchJob, job]);

  return {
    job,
    loading,
    error,
    cancel,
    refresh: fetchJob
  };
}
