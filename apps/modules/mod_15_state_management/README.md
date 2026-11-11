# Module 15: State Management

Defines a strict state pattern to prevent ad-hoc boolean flags:
- `UiState<T>`: `Initial`, `Loading`, `Success`, `Empty`, `Error`, `Offline`, `Refreshing`
- Enforces exhaustive UI rendering via `when(...)` pattern matching.
