#!/usr/bin/env python3
class JobDeduplicator:
    def __init__(self):
        self.processed_jobs = set()

    def try_claim_job(self, job_id: str) -> bool:
        if job_id in self.processed_jobs:
            return False # Already processed
        self.processed_jobs.add(job_id)
        return True
