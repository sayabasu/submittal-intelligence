#!/usr/bin/env bash
#
# start.sh — Start the Terabase Submittal Intelligence dev server
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT=3000
PID_FILE=".dev.pid"

# ── Colors ──────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  Terabase Submittal Intelligence  ${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Check if already running ────────────────────────────
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo -e "${YELLOW}⚠  Server is already running (PID $OLD_PID) on port $PORT${NC}"
    echo -e "   Stop it first with: ${BOLD}./stop.sh${NC}"
    echo ""
    exit 1
  else
    rm -f "$PID_FILE"
  fi
fi

# Fallback: check if port is in use by something else
if lsof -i :"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo -e "${RED}✖  Port $PORT is already in use by another process.${NC}"
  echo -e "   Free it first or run: ${BOLD}./stop.sh${NC}"
  echo ""
  exit 1
fi

# ── Install dependencies if needed ──────────────────────
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  npm install
  echo ""
fi

# ── Generate Prisma client ─────────────────────────────
echo -e "${CYAN}⚙  Generating Prisma client...${NC}"
npx prisma generate --no-hints 2>&1 | tail -1
echo ""

# ── Initialize database if needed ──────────────────────
DB_PATH="prisma/dev.db"
if [ ! -f "$DB_PATH" ]; then
  echo -e "${YELLOW}🗄  Database not found. Initializing...${NC}"
  npx prisma db push --skip-generate 2>&1 | tail -3
  echo ""
  echo -e "${YELLOW}🌱 Seeding database with demo data...${NC}"
  npx prisma db seed
  echo ""
else
  echo -e "${GREEN}✓  Database exists${NC}"
fi

# ── Start dev server ───────────────────────────────────
echo -e "${CYAN}🚀 Starting dev server on port $PORT...${NC}"
npm run dev > /dev/null 2>&1 &
DEV_PID=$!
echo "$DEV_PID" > "$PID_FILE"

# Wait for server to be ready
echo -ne "   Waiting for server"
for i in {1..15}; do
  if curl -s -o /dev/null http://localhost:"$PORT" 2>/dev/null; then
    echo ""
    echo ""
    echo -e "${GREEN}${BOLD}✓  Server is running!${NC}"
    echo ""
    echo -e "   ${BOLD}URL:${NC}  http://localhost:$PORT"
    echo -e "   ${BOLD}PID:${NC}  $DEV_PID"
    echo ""
    echo -e "   Stop with: ${BOLD}./stop.sh${NC}"
    echo ""
    exit 0
  fi
  echo -n "."
  sleep 1
done

# If we get here, server didn't start in time
echo ""
echo -e "${RED}✖  Server did not respond within 15 seconds.${NC}"
echo -e "   Check logs with: ${BOLD}cat .next/trace${NC}"
echo -e "   PID $DEV_PID saved to $PID_FILE"
echo ""
exit 1
