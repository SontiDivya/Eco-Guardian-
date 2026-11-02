# One-time schema setup for PostgreSQL. Importing app runs ensure_schema()
# against DATABASE_URL, which creates every table if it is missing.
from app import ensure_schema

ensure_schema()

print("PostgreSQL schema is ready.")
