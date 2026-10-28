#!/usr/bin/env bash
WEB_DIR="/mnt/c/Users/User/Desktop/красиво/web"
cd "$WEB_DIR"
exec node node_modules/.bin/next dev --port 3000 --hostname 0.0.0.0
