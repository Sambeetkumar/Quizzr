---
name: supabase-workflow
description: >-
  Use this skill when the user asks to interact with Supabase, perform database migrations, generate types, or manage edge functions.
---

# Supabase Workflow for Quizzr

This skill outlines the standard procedures for working with Supabase in the `quizzr` project.

## Steps

### 1. Generating Types
When asked to update or generate database types (TypeScript):
- **Command:** `npx supabase gen types typescript --local > src/types/supabase.ts` (if running Supabase locally).
- **Alternative:** If working against a remote database, ensure the correct `--project-id` flag is used.

### 2. Migrations
When asked to manage or create a database migration:
- **Create new migration:** `npx supabase migration new <migration_name>`
- **Apply migrations locally:** `npx supabase db reset` (resets database) or `npx supabase migration up` (applies new migrations).

### 3. Edge Functions
When asked to create or serve Supabase Edge Functions:
- **Create a new function:** `npx supabase functions new <function_name>`
- **Serve functions locally:** `npx supabase functions serve`

### 4. General Best Practices
- Always ensure the `supabase status` command is used to check if the local environment is running before executing commands that require it.
- Never commit sensitive keys (like `SERVICE_ROLE_KEY`) to the repository. Use `.env.local` for local development.

---
*Note: If specific scripts for these actions exist in `package.json`, prioritize using `npm run <script>` over raw `npx supabase` commands.*
