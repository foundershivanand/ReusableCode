import React, { useState, useEffect } from "react";
import { useAIContext } from "../client/react-context.js";
import type { BackgroundJob } from "../schemas/index.js";

export const BackgroundJobList: React.FC = () => {
  const client = useAIContext();
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await client.listJobs();
      setJobs(data);
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    await client.cancelJob(id);
    await fetchJobs();
  };

  const getStatusBadge = (status: BackgroundJob["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse";
      case "QUEUED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "FAILED":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case "DEAD_LETTER":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
      case "CANCELLED":
        return "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading background AI jobs...
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Background AI Jobs
          </h3>
          <p className="text-xs text-gray-500">
            Long-running asynchronous workflows and batch processing
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {jobs.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No background jobs found.
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {job.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${getStatusBadge(
                      job.status
                    )}`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Attempt {job.attempts}/{job.maxAttempts}
                  </span>
                  {(job.status === "QUEUED" || job.status === "PROCESSING") && (
                    <button
                      onClick={() => handleCancel(job.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {job.status === "PROCESSING" && (
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}

              {job.lastError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                  Error: {job.lastError}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
