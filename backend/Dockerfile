# Production Dockerfile for ActiveHQ API
# Run with: docker build -t activehq-api . && docker run -p 8000:8000 --env-file .env activehq-api

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Non-root user
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

RUN chown -R appuser:appuser /app
USER appuser

# Render sets PORT=10000; default 8000 for local Docker
ENV PORT=8000
EXPOSE ${PORT}

# Gunicorn + Uvicorn workers: stable under load for 100+ gyms
ENV GUNICORN_WORKERS=4
ENV GUNICORN_TIMEOUT=120
ENV GUNICORN_MAX_REQUESTS=1000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", \"8000\")}/health')" || exit 1

CMD gunicorn \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers ${GUNICORN_WORKERS} \
  --bind 0.0.0.0:${PORT} \
  --timeout ${GUNICORN_TIMEOUT} \
  --max-requests ${GUNICORN_MAX_REQUESTS} \
  --access-logfile - \
  --capture-output \
  app.main:app
