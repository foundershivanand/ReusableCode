# Risks & Failures: Experimentation & A/B Testing

## Failure Modes & Mitigations
1. **Sample-Ratio Mismatch (SRM)**: Bot traffic, ad blockers, or redirection bugs cause 70/30 split when 50/50 was targeted.
   - *Mitigation*: Continuous automated Chi-Square goodness-of-fit test flags SRM on `<ExperimentResultsCard />`.
2. **Incompatible Experiment Contamination**: User experiences conflicting UI modifications from two concurrent experiments.
   - *Mitigation*: Mutual exclusion groups enforce that a user is allocated to at most one experiment in the group.
3. **Dead Code Accumulation**: Experiments conclude, but branching flags remain in the codebase.
   - *Mitigation*: Lifecycle state `ARCHIVED` triggers CI dead-code elimination tasks.
