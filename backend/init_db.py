from flask import Flask, render_template, request
import sqlite3

connection = sqlite3.connect("eco_guardian.db")

connection.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        issue TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

connection.execute("""
    ALTER TABLE reports
    ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending'
""")

connection.commit()
connection.close()

print("Reports table created successfully!")
