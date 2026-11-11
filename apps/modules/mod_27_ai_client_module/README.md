# Module 27: AI Client Module

Client-side AI integration:
- Never includes sensitive raw AI provider keys in client binary.
- Routes all AI requests through `mod_28_ai_cost_gateway`.
- Supports Server-Sent Events (SSE) streaming for typing animations.
