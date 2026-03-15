#!/usr/bin/env bash
#
# stop.sh — Stop the Terabase Submittal Intelligence dev server
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT=3000
PID_FILE=".dev.pid"

# ── Colors ──────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo ""

STOPPED=false

# ── Try PID file first ─────────────────────────────────
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo -e "${YELLOW}⏹  Stopping server (PID $PID)...${NC}"
    kill "$PID" 2>/dev/null
    # Wait for process to exit
    for i in {1..5}; do
      if ! kill -0 "$PID" 2>/dev/null; then
        break
      fi
      sleep 1
    done
    # Force kill if still running
    if kill -0 "$PID" 2>/dev/null; then
      kill -9 "$PID" 2>/dev/null
    fi
    STOPPED=true
  fi
  rm -f "$PID_FILE"
fi

# ── Fallback: kill anything on the port ────────────────
PORT_PIDS=$(lsof -ti :"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$PORT_PIDS" ]; then
  echo -e "${YELLOW}⏹  Killing process(es) on port $PORT: $PORT_PIDS${NC}"
  echo "$PORT_PIDS" | xargs kill 2>/dev/null || true
  sleep 1
  # Force kill stragglers
  REMAINING=$(lsof -ti :"$PORT" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$REMAINING" ]; then
    echo "$REMAINING" | xargs kill -9 2>/dev/null || true
  fi
  STOPPED=true
fi

# ── Result ─────────────────────────────────────────────
if [ "$STOPPED" = true ]; then
  echo -e "${GREEN}${BOLD}✓  Server stopped.${NC}"
else
  echo -e "${YELLOW}ℹ  No server was running on port $PORT.${NC}"
fi

echo ""
