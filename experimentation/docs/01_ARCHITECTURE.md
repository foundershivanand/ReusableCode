# Architecture: Experimentation & A/B Testing

## Overview
The Experimentation module enables deterministic variant allocation, exposure tracking, mutual exclusion grouping, conversion tracking, Sample-Ratio Mismatch (SRM) detection, and raw statistical reporting.

## Core Capabilities
1. **Deterministic Consistent Hashing**:
   - Uses SHA-256 hashing of `experimentId:userId` mapped to `[0, 99]` to guarantee users receive consistent variant assignments across all sessions and devices.
2. **Assignment Persistence**:
   - Once assigned, a user's variant is persisted to prevent jumping between control and variant.
3. **Separation of Assignment and Exposure**:
   - Tracks `assigned` vs `exposed` independently. Conversions are only attributed to users who were actively exposed to the experimental variant.
4. **Mutual Exclusion Groups**:
   - Prevents experiment contamination by ensuring users participate in at most one experiment within any defined mutual exclusion group.
5. **No Premature Winner Declaration**:
   - Displays raw metrics, sample sizes, standard errors, and confidence intervals rather than declaring artificial statistical winners.
