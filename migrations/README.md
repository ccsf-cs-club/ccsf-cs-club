# Database Migrations

This directory contains database migration files organized by service/provider.

## Structure

- `neon/` - Migrations for Neon PostgreSQL database
  - Files should be named with timestamp prefix: `YYYYMMDD_HHMMSS_description.sql`
  - Run manually via Neon dashboard UI

## Usage

### Neon Database
Migrations in `neon/` should be executed manually through the Neon dashboard UI:
1. Navigate to your Neon project console
2. Go to the SQL Editor
3. Copy and paste the migration file contents
4. Execute the SQL

### Adding New Migrations
1. Create a new `.sql` file in the appropriate service directory
2. Use descriptive names with timestamp prefixes
3. Include both forward migration and rollback comments
4. Test locally before running in production