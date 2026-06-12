---
name: Enterprise OS backend quirks
description: Non-obvious decisions and sharp edges for the Enterprise OS FastAPI backend
---

## Password hashing: PBKDF2, not bcrypt

passlib 1.7.4 is incompatible with bcrypt 5.0.0. bcrypt 5 enforces the 72-byte limit strictly; passlib's `detect_wrap_bug` sends a 72+ byte test string on first hash, raising `ValueError: password cannot be longer than 72 bytes`.

**Fix:** use `hashlib.pbkdf2_hmac` directly in `backend/app/core/security.py`. No passlib, no bcrypt.

**Why:** bcrypt 4+ tightened enforcement; passlib 1.7.4 (last release 2020) never adapted.

**How to apply:** Do NOT re-introduce passlib or bcrypt. If password hashing needs upgrading, use argon2-cffi instead.

## DATABASE_URL conflict

The Replit workspace sets `DATABASE_URL` to the PostgreSQL connection string for the shared DB. The Enterprise OS backend uses SQLite, so it reads `ENTERPRISE_DB_URL` instead, defaulting to `sqlite:///./enterprise_os.db`.

**Why:** Avoids psycopg2 import error at startup when `DATABASE_URL` points to Postgres.

## custom-fetch subpath export

`@workspace/api-client-react/custom-fetch` must be listed in `lib/api-client-react/package.json` under `exports`:
```json
"./custom-fetch": "./src/custom-fetch.ts"
```
Without this, Vite's dep-scan fails with "Missing './custom-fetch' specifier" and the frontend won't build.

## Python backend in api-server artifact

The `artifacts/api-server` artifact runs the Python FastAPI backend, not Node.js. The run command in artifact.toml:
```
cd /home/runner/workspace/backend && /home/runner/workspace/.pythonlibs/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```
uvicorn binary: `/home/runner/workspace/.pythonlibs/bin/uvicorn`

## DB reset

Delete `backend/enterprise_os.db` to force a clean re-seed on next startup.
The startup event only seeds if tables are empty (`if db.query(Model).count() == 0`).

## API prefix

The `/api` prefix is applied in Python routes (`prefix="/api"` in `main.py`), not via uvicorn's `root_path`. This matches the proxy routing in artifact.toml (`paths = ["/api"]`).
