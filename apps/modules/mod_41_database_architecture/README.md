# Module 41: Database Architecture

Encrypted SQLite migration engine:
- Manages sequential schema migrations (`V1__init.sql`, `V2__add_indexes.sql`)
- Atomic transaction wrapping ensures no partial migrations on crash
