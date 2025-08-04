-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Set timezone
SET timezone = 'UTC';

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;