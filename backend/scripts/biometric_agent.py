"""
ActiveHQ Biometric Agent (Gym PC)

Polls eSSL/ZK device over LAN (TCP 4370) and pushes attendance logs to ActiveHQ API.

Usage (Windows PowerShell):
  python -m pip install -r scripts/biometric_agent_requirements.txt
  $env:DEVICE_IP="192.168.1.11"
  $env:DEVICE_PORT="4370"
  $env:DEVICE_TIMEZONE="Asia/Kolkata"
  $env:EXTERNAL_DEVICE_ID="essl-x2008-1"
  $env:ACTIVEHQ_API_BASE="https://api.activehq.fit"
  $env:ACTIVEHQ_BIOMETRIC_TOKEN="<from /api/v1/biometric/devices/{id}/token>"
  python scripts/biometric_agent.py

Mapping:
  The device's user_id must match Member.member_code in ActiveHQ.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx


@dataclass
class Config:
    device_ip: str
    device_port: int
    device_timezone: str
    external_device_id: str
    api_base: str
    biometric_token: str
    poll_seconds: int = 10
    batch_size: int = 200
    state_path: Path = Path("biometric_agent_state.json")


def _env(name: str, default: str | None = None) -> str:
    v = (os.getenv(name) or "").strip()
    if v:
        return v
    if default is None:
        raise SystemExit(f"Missing env var: {name}")
    return default


def load_config() -> Config:
    return Config(
        device_ip=_env("DEVICE_IP"),
        device_port=int(_env("DEVICE_PORT", "4370")),
        device_timezone=_env("DEVICE_TIMEZONE", "Asia/Kolkata"),
        external_device_id=_env("EXTERNAL_DEVICE_ID"),
        api_base=_env("ACTIVEHQ_API_BASE").rstrip("/"),
        biometric_token=_env("ACTIVEHQ_BIOMETRIC_TOKEN"),
        poll_seconds=int(_env("POLL_SECONDS", "10")),
        batch_size=int(_env("BATCH_SIZE", "200")),
        state_path=Path(_env("STATE_PATH", "biometric_agent_state.json")),
    )


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"last_seen_ts": None, "sent_event_ids": []}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"last_seen_ts": None, "sent_event_ids": []}


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


def _attendance_to_event(record: Any, tz_name: str) -> dict[str, Any]:
    # pyzk record usually exposes: user_id, timestamp, status, punch
    user_id = str(getattr(record, "user_id", "") or getattr(record, "uid", "") or "")
    ts: datetime = getattr(record, "timestamp", None) or getattr(record, "time", None)
    if not isinstance(ts, datetime):
        ts = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    # Make a stable external_event_id (deviceUserId + epoch seconds + punch/status)
    punch = str(getattr(record, "punch", "") or getattr(record, "status", "") or "")
    external_event_id = f"{user_id}:{int(ts.timestamp())}:{punch}"
    return {
        "external_event_id": external_event_id,
        "person_identifier": user_id,
        "event_time": ts.isoformat(),
        "event_type": "unknown",
        "device_offset_minutes": 0,
        "raw_payload": {
            "user_id": user_id,
            "timestamp": ts.isoformat(),
            "punch": getattr(record, "punch", None),
            "status": getattr(record, "status", None),
            "device_timezone": tz_name,
        },
    }


def fetch_attendance(config: Config) -> list[Any]:
    try:
        from zk import ZK  # type: ignore
    except Exception as exc:
        raise SystemExit("pyzk not installed. Run: pip install -r scripts/biometric_agent_requirements.txt") from exc

    zk = ZK(config.device_ip, port=config.device_port, timeout=10, force_udp=False, ommit_ping=False)
    conn = None
    try:
        conn = zk.connect()
        # Some devices require this for proper timestamp decoding
        try:
            conn.disable_device()
        except Exception:
            pass
        logs = conn.get_attendance() or []
        return logs
    finally:
        if conn is not None:
            try:
                conn.enable_device()
            except Exception:
                pass
            try:
                conn.disconnect()
            except Exception:
                pass


def push_events(config: Config, events: list[dict[str, Any]]) -> dict[str, Any]:
    url = f"{config.api_base}/api/v1/biometric/events/ingest-device"
    payload = {"external_device_id": config.external_device_id, "events": events}
    headers = {"X-Biometric-Token": config.biometric_token, "Content-Type": "application/json"}
    with httpx.Client(timeout=30.0) as client:
        r = client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        return r.json()


def main() -> None:
    config = load_config()
    state = load_state(config.state_path)
    sent_ids: set[str] = set(state.get("sent_event_ids") or [])

    print(f"[agent] device={config.device_ip}:{config.device_port} external_device_id={config.external_device_id}")
    print(f"[agent] api={config.api_base} poll={config.poll_seconds}s batch={config.batch_size}")

    while True:
        try:
            logs = fetch_attendance(config)
            # Convert and filter out already sent IDs (simple dedupe)
            events: list[dict[str, Any]] = []
            for rec in logs:
                ev = _attendance_to_event(rec, config.device_timezone)
                if ev["external_event_id"] in sent_ids:
                    continue
                events.append(ev)

            # Send in batches
            total_sent = 0
            for i in range(0, len(events), config.batch_size):
                chunk = events[i : i + config.batch_size]
                if not chunk:
                    continue
                result = push_events(config, chunk)
                total_sent += len(chunk)
                for ev in chunk:
                    sent_ids.add(ev["external_event_id"])
                # keep state bounded
                if len(sent_ids) > 5000:
                    sent_ids = set(list(sent_ids)[-3000:])
                state["sent_event_ids"] = list(sent_ids)
                save_state(config.state_path, state)
                print(f"[agent] pushed {len(chunk)} events -> {result}")

            if total_sent == 0:
                print("[agent] no new events")
        except httpx.HTTPStatusError as e:
            print(f"[agent] API error: {e.response.status_code} {e.response.text[:200]}")
        except Exception as e:
            print(f"[agent] error: {e}")

        time.sleep(config.poll_seconds)


if __name__ == "__main__":
    main()

