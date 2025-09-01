# EveryTriv Server

## Database Migrations

This project uses TypeORM migrations for database schema management. **Never use `synchronize: true`** as it can cause data loss and inconsistencies.

### Migration Commands

```bash
# Generate a new migration (after entity changes)
pnpm migration:generate src/migrations/MigrationName

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Create empty migration file
pnpm migration:create src/migrations/MigrationName

# Drop entire schema (DANGEROUS - only for development)
pnpm schema:drop
```

### Migration Workflow

1. **Make entity changes** in `src/shared/entities/`
2. **Generate migration**: `pnpm migration:generate src/migrations/DescriptiveName`
3. **Review generated migration** in `src/migrations/`
4. **Run migration**: `pnpm migration:run`
5. **Test the changes**

### Important Notes

- **Never commit migrations with `synchronize: true`**
- **Always review generated migrations** before running
- **Test migrations in development** before production
- **Backup database** before running migrations in production
- **Use descriptive migration names** that explain the change

### Environment Setup

The database configuration automatically sets `synchronize: false` for all environments to ensure migrations are always used.

### Troubleshooting

If you encounter migration issues:

1. Check migration status: `pnpm migration:show`
2. Verify database connection
3. Review migration files for syntax errors
4. Consider reverting and regenerating if needed
