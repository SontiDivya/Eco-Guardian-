import sqlite3

connection = sqlite3.connect("eco_guardian.db")

# Column names, in table order.
columns = [row[1] for row in connection.execute("PRAGMA table_info(reports)")]

records = connection.execute("SELECT * FROM reports").fetchall()

# Header row, a separator, then every record underneath it.
print(" | ".join(columns))
print("-" * len(" | ".join(columns)))

for record in records:
    print(" | ".join("" if value is None else str(value) for value in record))

print()
print(len(records), "record(s)")

connection.close()