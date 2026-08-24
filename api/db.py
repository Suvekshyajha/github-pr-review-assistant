import sqlite3
import json
from datetime import datetime

DB_PATH = "reviews.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner TEXT NOT NULL,
            repo TEXT NOT NULL,
            pr_number INTEGER NOT NULL,
            review_text TEXT,
            context_chunks_json TEXT,
            status TEXT DEFAULT 'completed',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS connected_repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner TEXT NOT NULL,
            repo TEXT NOT NULL,
            webhook_id INTEGER,
            connected_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()

def save_review(owner, repo, pr_number, review_text, context_chunks):
    conn = get_connection()
    conn.execute("""
        INSERT INTO reviews (owner, repo, pr_number, review_text, context_chunks_json)
        VALUES (?, ?, ?, ?, ?)
    """, (owner, repo, pr_number, review_text, json.dumps(context_chunks)))
    conn.commit()
    conn.close()

def get_all_reviews():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM reviews ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_review_by_id(review_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM reviews WHERE id = ?", (review_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def save_connected_repo(owner: str, repo: str, webhook_id: int):
    conn = get_connection()
    conn.execute("""
        INSERT INTO connected_repos (owner, repo, webhook_id)
        VALUES (?, ?, ?)
    """, (owner, repo, webhook_id))
    conn.commit()
    conn.close()

def get_all_connected_repos():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM connected_repos ORDER BY connected_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_connected_repo(repo_id: int) -> dict:
    conn = get_connection()
    row = conn.execute("SELECT * FROM connected_repos WHERE id = ?", (repo_id,)).fetchone()
    if row:
        conn.execute("DELETE FROM connected_repos WHERE id = ?", (repo_id,))
        conn.commit()
    conn.close()
    return dict(row) if row else None