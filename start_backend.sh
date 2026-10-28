#!/usr/bin/env bash
set -e
BACKEND_DIR="/mnt/c/Users/User/Desktop/красиво/backend"
export PYTHONPATH="$BACKEND_DIR"
cd "$BACKEND_DIR"
exec /opt/krasivo_venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
