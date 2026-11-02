from app import connect

connection = connect()

# Column names, in table order, then every record underneath.
cursor = connection.execute("SELECT * FROM reports ORDER BY id")
columns = [item[0] for item in cursor.description]

records = cursor.fetchall()

# Header row, a separator, then every record underneath it.
print(" | ".join(columns))
print("-" * len(" | ".join(columns)))

for record in records:
    print(" | ".join("" if value is None else str(value) for value in record))

print()
print(len(records), "record(s)")

connection.close()