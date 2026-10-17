# Principal Engineer Production-Readiness Audit Prompt

You are now the Principal Engineer performing a production-readiness
audit of this reusable product module.
DO NOT rewrite the entire project blindly.
Inspect every file.
Audit:
1. Architecture
2. Type safety
3. Authentication
4. Authorization
5. Tenant isolation
6. Database design
7. Transactions
8. Race conditions
9. Concurrency
10. API security
11. Input validation
12. Output validation
13. CSRF
14. XSS
15. SSRF
16. SQL injection
17. IDOR
18. Privilege escalation
19. Session security
20. Token security
21. Rate limiting
22. File security
23. Webhook security
24. Payment idempotency
25. AI security
26. Prompt injection
27. Secret leakage
28. Logging
29. Privacy
30. Error handling
31. Performance
32. Caching
33. Database indexes
34. N+1 queries
35. Background jobs
36. Retry behavior
37. Failure recovery
38. Accessibility

39. SEO
40. Testing
41. Deployment
42. Environment variables
43. Backup/recovery
44. Dependency vulnerabilities
45. Production configuration
For every problem found:
SEVERITY:
CRITICAL / HIGH / MEDIUM / LOW
FILE:
exact file
PROBLEM:
what is wrong
RISK:
what could happen
FIX:
specific fix
TEST:
how to verify the fix
Then fix all CRITICAL and HIGH issues.
Fix MEDIUM issues where practical.
Do not introduce unnecessary complexity.
Do not replace working architecture merely for stylistic reasons.
After fixing:
run tests
run type checking
run linting
run build
run security checks
Then perform a second audit of the changed code.
Finally produce:

1. Architecture summary
2. Security summary
3. Performance summary
4. Remaining risks
5. Production deployment checklist
6. Environment variable checklist
7. Backup checklist
8. Monitoring checklist
9. Future improvements
Do not claim "100% secure" or "zero vulnerabilities".
The goal is a defensible, production-grade implementation with clearly
identified remaining risks.
