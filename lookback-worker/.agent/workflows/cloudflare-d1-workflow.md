---
description: Cloudflare D1 Development Workflow
---

# Cloudflare D1 Development Workflow

This document explains how Cloudflare D1 databases are structured and how to work with them effectively.

## Database Structure

Cloudflare D1 uses two separate databases for each binding to prevent accidental data loss in production:

1.  **Production Database** (`database_id`): Used by your deployed Worker (`wrangler deploy`).
2.  **Preview Database** (`preview_database_id`): Used during development (`wrangler dev --remote`).

## Workflow

### 1. Local Development (Recommended)
Fastest way to develop. Uses a local SQLite file on your machine.
```bash
# Run dev server locally
wrangler dev

# Apply migrations locally
wrangler d1 migrations apply lookback --local
```

### 2. Remote Development (Preview)
Test against a real D1 database on Cloudflare, but isolated from production.
```bash
# Run dev server connected to Remote Preview DB
wrangler dev --remote

# Apply migrations to Remote Preview DB
# Note: Wrangler defaults to Production for migrations. To target Preview, you may need to temporarily swap IDs in wrangler.jsonc or use a specific flag if available (currently limited).
# Workaround: Swap IDs in wrangler.jsonc, run migration, swap back.
```

### 3. Production Deployment
Deploy your code to the world. Uses the Production DB.
```bash
# Deploy to Cloudflare
wrangler deploy

# Apply migrations to Production DB
wrangler d1 migrations apply lookback --remote
```

## Common Commands

| Action | Command | Target DB |
|--------|---------|-----------|
| Check Local Data | `wrangler d1 execute lookback --local --command "SELECT * FROM users"` | Local SQLite |
| Check Preview Data | `wrangler d1 execute lookback --remote --preview --command "SELECT * FROM users"` | Remote Preview (`3e66...`) |
| Check Production Data | `wrangler d1 execute lookback --remote --command "SELECT * FROM users"` | Remote Production (`3f0b...`) |

## Troubleshooting

- **"No such table"**: You need to apply migrations to the specific environment (Local, Preview, or Production) you are trying to access.
- **Data missing**: You might be looking at the wrong database (e.g., created data in Preview but checking Production).
