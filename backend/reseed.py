"""Wipe the local database and re-seed the demo matters.

Usage (from the backend/ folder, with the server STOPPED):

    py reseed.py

Deletes the SQLite file (and its WAL/SHM siblings) then re-initializes, which
re-runs the demo seed because the tables are empty.
"""
from __future__ import annotations

import os

from app.config import get_settings
from app.db import init_db


def main() -> None:
    path = get_settings().sqlite_path
    removed = False
    for suffix in ("", "-wal", "-shm"):
        target = path + suffix
        if os.path.exists(target):
            try:
                os.remove(target)
                print(f"removed {target}")
                removed = True
            except PermissionError:
                print(
                    f"ERROR: could not delete {target} — is the server still running? "
                    "Stop uvicorn (Ctrl+C) and run this again."
                )
                return
    if not removed:
        print("no existing database found — will create a fresh one")

    init_db()
    print("database re-seeded. Restart the server: py -m uvicorn app.main:app --port 8000")


if __name__ == "__main__":
    main()
