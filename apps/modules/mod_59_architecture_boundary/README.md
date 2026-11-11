# Module 59: Architecture Boundary Linter

Enforces boundary separation:
- Prohibits cross-app imports (`app-001` cannot import `app-002`)
- Ensures shared modules do not import app-specific feature code
