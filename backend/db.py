import sqlite3
import json

DB_NAME = "results.db"

def init():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt TEXT NOT NULL,
                timestamp REAL NOT NULL,
                datetime TEXT NOT NULL,
                supervised INTEGER NOT NULL,
                binary_clustering INTEGER NOT NULL,
                attack_type TEXT NOT NULL,
                attack_type_distance REAL NOT NULL
            )
        """)

def add_result(result):
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute("""
            INSERT INTO results (prompt, timestamp, datetime, supervised, binary_clustering, attack_type, attack_type_distance)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result['prompt'],
                result['timestamp'],
                result['datetime'],
                result['supervised'],
                result['binary_clustering'],
                result['attack_type']['label'],
                result['attack_type']['distance']
            )
        )

def get_results():
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM results ORDER BY id"
        ).fetchall()

    return {
        row["id"]: {
            "prompt": row["prompt"],
            "timestamp": row["timestamp"],
            "datetime": row["datetime"],
            "supervised": bool(row["supervised"]),
            "binary_clustering": bool(row["binary_clustering"]),
            "attack_type": {
                "label": row["attack_type"],
                "distance": row["attack_type_distance"]
            }
        }
        for row in rows
    }


def get_result(id):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM results WHERE id = ?",
            (id,)
        ).fetchone()

    if row is None:
        raise KeyError(id)

    return {
        "prompt": row["prompt"],
        "timestamp": row["timestamp"],
        "datetime": row["datetime"],
        "supervised": bool(row["supervised"]),
        "binary_clustering": bool(row["binary_clustering"]),
        "attack_type": {
            "label": row["attack_type"],
            "distance": row["attack_type_distance"]
        }
    }

def delete_result(id):
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute(
            "DELETE FROM results WHERE id = ?",
            (id,)
        )


def get_latest_result_id():
    with sqlite3.connect(DB_NAME) as conn:
        row = conn.execute("""
            SELECT id
            FROM results
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
        """).fetchone()

    return row[0]
