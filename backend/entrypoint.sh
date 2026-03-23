#!/bin/bash
set -e

echo "🗄️  Running Alembic migrations..."
cd /app
alembic upgrade head

echo "✅ Migrations complete. Starting Gunicorn server..."

exec gunicorn \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers ${GUNICORN_WORKERS:-4} \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout ${GUNICORN_TIMEOUT:-120} \
  --max-requests ${GUNICORN_MAX_REQUESTS:-1000} \
  --access-logfile - \
  --capture-output \
  app.main:app
