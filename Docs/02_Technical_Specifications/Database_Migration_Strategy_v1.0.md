# Database Migration Strategy - ClariFi Project v1.0

## 1. Overview

This document outlines the strategy for managing database schema changes and migrations for the ClariFi project. We utilize **Prisma Migrate** as our primary tool for schema management and migration generation, targeting a PostgreSQL database hosted on Supabase.

The goals of this strategy are to:
- Ensure consistent database schema across all environments (development, staging, production).
- Provide a reliable process for evolving the database schema.
- Enable version control for schema definitions and migration history.
- Minimize downtime and data loss during schema changes.

## 2. Tooling

- **Prisma CLI:** Used for all schema-related tasks, including introspection, migration generation, and deployment.
- **`schema.prisma`:** The single source of truth for our database schema.
- **`prisma/migrations` directory:** Contains all generated migration files (SQL), which are version-controlled.

## 3. Development Workflow

1.  **Modify Schema:** All schema changes (new tables, columns, relations, indexes, etc.) are made by editing the `clarifi-api/prisma/schema.prisma` file.
2.  **Generate Migration:** After saving changes to `schema.prisma`, a new migration is generated using the following command from the `clarifi-api` directory:
    ```bash
    npx prisma migrate dev --name <descriptive-migration-name>
    ```
    -   `<descriptive-migration-name>` should be a short, descriptive name for the changes (e.g., `add_user_profiles`, `create_transaction_indexes`).
    -   This command:
        -   Creates a new SQL migration file in `prisma/migrations/<timestamp>_<descriptive-migration-name>/migration.sql`.
        -   Applies the migration to the local development database.
        -   Ensures the development database schema is in sync with `schema.prisma`.
        -   Updates the Prisma Client if necessary.
3.  **Review Migration:** Developers should review the generated `migration.sql` file to understand the changes Prisma will apply and ensure they are as expected.
4.  **Test Locally:** Thoroughly test the application with the new schema changes locally.
5.  **Commit Changes:** Commit the updated `prisma/schema.prisma` file and the entire `prisma/migrations` directory (including the new migration folder) to Git.

## 4. Deployment Workflow (Staging & Production)

1.  **Deploy Code:** Ensure the latest version of the application code, including the updated `schema.prisma` and the `prisma/migrations` directory, is deployed to the target environment (staging or production).
2.  **Apply Migrations:** Before the new application code starts running, or as part of the deployment pipeline, apply pending migrations using the following command from the `clarifi-api` directory on the server or in the CI/CD environment:
    ```bash
    npx prisma migrate deploy
    ```
    -   This command:
        -   Applies all pending migrations from the `prisma/migrations` folder that have not yet been applied to the target database.
        -   Is non-interactive and suitable for automated deployment scripts.
        -   Does not generate new migrations or modify the `schema.prisma` file.
        -   Marks applied migrations in the `_prisma_migrations` table in the database.
3.  **Supabase GitHub Integration (Optional but Recommended for Staging/Production):**
    -   Supabase offers a GitHub integration that can automatically run `prisma migrate deploy` when changes are pushed to a specified branch (e.g., `main` for production, `develop` or `staging` for staging).
    -   This can simplify the deployment process and ensure migrations are applied consistently. Configure this in the Supabase dashboard under "Database" -> "Migrations".

## 5. Version Control

-   The `clarifi-api/prisma/schema.prisma` file **MUST** be committed to Git.
-   The entire `clarifi-api/prisma/migrations` directory **MUST** be committed to Git. This directory contains the history of all schema changes.
-   The `clarifi-api/.env` file (containing `DATABASE_URL`) **MUST NOT** be committed to Git. Use environment variables in deployment environments.

## 6. Row-Level Security (RLS) and Custom SQL

-   **RLS Policies:** Row-Level Security policies are critical for data security in Supabase.
    -   RLS policies are defined directly in SQL.
    -   Initial RLS setup should be applied via the Supabase SQL Editor or as a separate SQL script run during initial environment setup. The SQL for these policies is maintained in project documentation (e.g., within Task Master subtask details or a dedicated SQL file in the repository).
    -   If RLS policies need to be updated, these changes should be scripted and applied carefully, similar to migrations. Prisma Migrate does not directly manage RLS policy changes based on the `schema.prisma` file.
    -   It is possible to include RLS `CREATE POLICY` or `ALTER POLICY` statements within a Prisma migration's SQL file if they are directly tied to schema changes in that migration. However, this requires manual editing of the generated `migration.sql` file, which should be done with caution.
-   **Other Custom SQL (Triggers, Functions):**
    -   Similar to RLS, custom PostgreSQL functions or triggers are not automatically managed by Prisma Migrate based on the `schema.prisma`.
    -   These should be scripted and version-controlled. They can be applied manually, via deployment scripts, or by including their definitions in the SQL of a relevant Prisma migration file (again, with caution if manually editing).

## 7. Branching Strategy and Conflicts

-   **Feature Branches:** When working on feature branches that involve schema changes:
    -   Each developer generates migrations on their own branch as needed.
    -   When merging a feature branch into a main development branch (e.g., `develop`), migration files will be merged.
-   **Migration Conflicts:**
    -   Conflicts in the `schema.prisma` file should be resolved like any other code conflict.
    -   Migration history conflicts (e.g., two developers create migrations with overlapping timestamps or conflicting changes) can be more complex.
    -   **Best Practice:** Regularly pull changes from the main development branch into feature branches (`git pull origin develop`). If migration conflicts arise that Prisma cannot resolve automatically, the team may need to:
        1.  Reset their local database to a state before the conflicting migrations.
        2.  Manually adjust migration files or re-generate migrations in a consistent order.
        3.  One common approach for a feature branch that has diverged is to `prisma migrate reset` locally, re-apply migrations from the main branch, and then re-generate their feature-specific migration on top of that. This ensures their migration is based on the latest main branch schema.
-   **Production Hotfixes:** Hotfixes on a production branch that require schema changes should be rare. If necessary, migrations should be generated on the hotfix branch, applied to production, and then merged back into the main development branches.

## 8. Rollback Strategy

-   **Development:**
    -   In development, if a migration causes issues or needs to be undone *before it's widely shared or merged*, `npx prisma migrate reset` can be used. This will drop the database and reapply all migrations from the beginning (or just reset to a clean state if no migrations exist after the reset).
    -   Alternatively, manually revert the `schema.prisma` changes, delete the problematic migration folder from `prisma/migrations`, and then generate a new migration if needed.
-   **Staging & Production:**
    -   `prisma migrate deploy` applies migrations in a forward-only manner. Prisma does not automatically generate "down" scripts for deployed migrations.
    -   **Primary Rollback Strategy:** Restore the database from a backup taken before the problematic migration was applied. Supabase provides Point-in-Time Recovery (PITR) capabilities.
    -   **Corrective Migration:** If a rollback by restoring a backup is too disruptive or data loss is a concern, the preferred approach is to create a new "corrective" migration that undoes or fixes the changes introduced by the problematic migration.
        -   Modify `schema.prisma` to reflect the desired (corrected) state.
        -   Generate a new migration: `npx prisma migrate dev --name fix_issue_from_previous_migration`.
        -   Deploy this new corrective migration.
    -   **Manual Intervention:** For very complex issues, direct database intervention by a database administrator might be required, followed by steps to bring the Prisma schema and migration history back in sync.

## 9. Seeding Data

-   Data seeding is managed separately from schema migrations.
-   Prisma offers a seeding mechanism (see Prisma documentation on "Seeding your database").
-   Seed scripts can be run using `npx prisma db seed` after migrations have been successfully applied.

## 10. Documentation and Communication

-   All schema changes should be discussed within the team, especially if they are significant or impact multiple parts of the application.
-   The `<descriptive-migration-name>` used with `prisma migrate dev` should clearly communicate the purpose of the migration.
-   Pull Requests containing schema changes should clearly list the migrations included and their purpose.

By following this strategy, we aim to maintain a stable, version-controlled, and evolving database schema for the ClariFi application. 