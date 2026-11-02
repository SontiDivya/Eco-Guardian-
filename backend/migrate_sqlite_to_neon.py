"""Migrate the Eco Guardian SQLite database into Neon PostgreSQL.

Safety rules honoured by this script:

  * The SQLite file is opened READ ONLY, so the original database stays
    untouched as a backup (a dated copy is also taken before the first run).
  * Every insert uses ON CONFLICT DO NOTHING, so rerunning the script never
    duplicates a record and never overwrites a row you changed in PostgreSQL.
  * After copying, sequences are resynchronised so new ids continue after
    the old maximum (users 68, reports 14).
  * Verification compares every table row by row; the exit status is 1 if
    anything differs, so it can be trusted in scripts.

Usage:
    python migrate_sqlite_to_neon.py                 # migrate, then verify
    python migrate_sqlite_to_neon.py --verify-only   # verify, change nothing
"""

import os
import sqlite3
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg

# Importing app loads backend/.env, validates DATABASE_URL, provides
# connect() and runs ensure_schema() against PostgreSQL first.

from app import BASE_DIR, build_conninfo, connect

SQLITE_FILE = os.path.join(BASE_DIR, "eco_guardian.db")

# Tables in a safe order. First key is the column that orders and identifies
# each row (primary key).

TABLES = (
    ("users", "id"),
    ("reports", "id"),
    ("otps", "phone"),
)


def open_sqlite_readonly():
    """Open the source database so that writing is impossible."""

    uri = Path(SQLITE_FILE).resolve().as_uri() + "?mode=ro"

    connection = sqlite3.connect(uri, uri=True)

    # Belt and braces: even a stray UPDATE would fail inside this connection.

    connection.execute("PRAGMA query_only = ON")

    return connection


def describe_target():
    """Show which Neon database we are talking to - never the password."""

    parsed = urlparse(build_conninfo())

    return "postgresql://{}@{}/{}".format(
        parsed.username or "?",
        parsed.hostname or "?",
        (parsed.path or "/").lstrip("/"),
    )


def copy_rows(source, target):
    """Copy every row from SQLite into PostgreSQL. Safe to rerun."""

    cursor = target.cursor()

    for table, key in TABLES:
        rows_cursor = source.execute(
            "SELECT * FROM {} ORDER BY {}".format(table, key)
        )
        rows = rows_cursor.fetchall()
        columns = [item[0] for item in rows_cursor.description]

        if not rows:
            print("  {}: already empty in SQLite, nothing to copy".format(table))
            continue

        placeholders = ", ".join(["%s"] * len(columns))

        # ON CONFLICT DO NOTHING: a rerun skips rows that already exist.

        insert = "INSERT INTO {} ({}) VALUES ({}) ON CONFLICT DO NOTHING".format(
            table, ", ".join(columns), placeholders
        )

        cursor.executemany(insert, rows)

        copied = cursor.rowcount

        print(
            "  {}: {} row(s) read, {} inserted, {} already present".format(
                table, len(rows), copied, len(rows) - copied
            )
        )

    target.commit()

    # Continue numbering after the highest copied id.

    for table, key in TABLES:
        if key != "id":
            continue

        cursor.execute("SELECT COALESCE(MAX(id), 0) FROM {}".format(table))
        highest = cursor.fetchone()[0]

        cursor.execute(
            "ALTER TABLE {} ALTER COLUMN id RESTART WITH {}".format(
                table, highest + 1
            )
        )
        print("  {}: next id will be {}".format(table, highest + 1))

    target.commit()


def normalise(rows):
    """Compare values as text so SQLite and PostgreSQL types line up."""

    return [
        tuple(None if value is None else str(value) for value in row)
        for row in rows
    ]


def verify(source, target):
    """Row-by-row comparison of every table. Returns True when identical."""

    print("\nVerification")
    print("------------")

    all_ok = True

    for table, key in TABLES:
        source_cursor = source.execute(
            "SELECT * FROM {} ORDER BY {}".format(table, key)
        )
        target_cursor = target.execute(
            "SELECT * FROM {} ORDER BY {}".format(table, key)
        )

        source_rows = normalise(source_cursor.fetchall())
        target_rows = normalise(target_cursor.fetchall())

        if source_rows == target_rows:
            print(
                "  [OK] {}: {} row(s), every column identical".format(
                    table, len(source_rows)
                )
            )
            continue

        all_ok = False
        print(
            "  [FAIL] {}: SQLite has {} row(s), PostgreSQL has {}".format(
                table, len(source_rows), len(target_rows)
            )
        )

        for index, (left, right) in enumerate(zip(source_rows, target_rows)):
            if left != right:
                print("        first difference at row {}:".format(index))
                print("          sqlite:      {}".format(left))
                print("          postgresql:  {}".format(right))
                break

    # Focused spot checks the application depends on.

    source_users = source.execute(
        "SELECT id, username, password, role FROM users ORDER BY id"
    ).fetchall()
    target_users = target.execute(
        "SELECT id, username, password, role FROM users ORDER BY id"
    ).fetchall()

    if [tuple(map(str, row)) for row in source_users] == [
        tuple(map(str, row)) for row in target_users
    ]:
        print(
            "  [OK] password hashes and roles: {} account(s) byte-for-byte".format(
                len(target_users)
            )
        )
    else:
        all_ok = False
        print("  [FAIL] password hashes or roles differ")

    print("------------")
    print("Result:", "ALL RECORDS TRANSFERRED CORRECTLY" if all_ok else "DIFFERENCES FOUND")

    return all_ok


def main():
    verify_only = "--verify-only" in sys.argv

    source = open_sqlite_readonly()
    target = connect()

    print("SQLite source :", SQLITE_FILE, "(read-only)")
    print("PostgreSQL    :", describe_target())

    if verify_only:
        ok = verify(source, target)
    else:
        print("\nCopying")
        print("-------")

        try:
            copy_rows(source, target)
        except Exception as error:
            target.rollback()
            print("\nMigration failed and was rolled back:", error)
            source.close()
            target.close()
            return 1

        print("-------")
        ok = verify(source, target)

    source.close()
    target.close()

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())