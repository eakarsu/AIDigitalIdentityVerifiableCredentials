#!/bin/bash

# AI Digital Identity & Verifiable Credentials Platform - Start Script
# ====================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     AI Digital Identity & Verifiable Credentials Platform   ║"
echo "║                    Starting Services...                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Kill processes on used ports
echo -e "${YELLOW}[1/7] Cleaning up ports...${NC}"
for PORT in 3001 5173; do
  PID=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo -e "  ${RED}Killing process on port $PORT (PID: $PID)${NC}"
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
done
echo -e "  ${GREEN}Ports 3001 and 5173 are free${NC}"

# Step 2: Check PostgreSQL
echo -e "${YELLOW}[2/7] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "  ${RED}PostgreSQL is not installed. Please install it first.${NC}"
  exit 1
fi

# Try to start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 3
fi

if pg_isready -q 2>/dev/null; then
  echo -e "  ${GREEN}PostgreSQL is running${NC}"
else
  echo -e "  ${RED}PostgreSQL is not running. Please start it manually.${NC}"
  exit 1
fi

# Step 3: Create database if not exists
echo -e "${YELLOW}[3/7] Setting up database...${NC}"
DB_NAME="ai_digital_identity"
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${GREEN}Database '$DB_NAME' already exists${NC}"
else
  echo -e "  ${CYAN}Creating database '$DB_NAME'...${NC}"
  createdb "$DB_NAME" 2>/dev/null || psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}Database created${NC}"
fi

# Step 4: Install dependencies
echo -e "${YELLOW}[4/7] Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "  ${CYAN}Installing root dependencies...${NC}"
  npm install
else
  echo -e "  ${GREEN}Root dependencies already installed${NC}"
fi

if [ ! -d "client/node_modules" ]; then
  echo -e "  ${CYAN}Installing client dependencies...${NC}"
  cd client && npm install && cd ..
else
  echo -e "  ${GREEN}Client dependencies already installed${NC}"
fi

# Step 5: Load env
echo -e "${YELLOW}[5/7] Loading environment...${NC}"
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "  ${GREEN}.env file loaded${NC}"
else
  echo -e "  ${RED}.env file not found! Please create one.${NC}"
  exit 1
fi

# Step 6: Seed database
echo -e "${YELLOW}[6/7] Seeding database...${NC}"
node server/seed.js
echo -e "  ${GREEN}Database seeded successfully${NC}"

# Step 7: Start services with hot reload
echo -e "${YELLOW}[7/7] Starting services with hot reload...${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Services Starting                        ║${NC}"
echo -e "${GREEN}║                                                             ║${NC}"
echo -e "${GREEN}║  Backend API:  ${CYAN}http://localhost:3001${GREEN}                        ║${NC}"
echo -e "${GREEN}║  Frontend:     ${CYAN}http://localhost:5173${GREEN}                        ║${NC}"
echo -e "${GREEN}║                                                             ║${NC}"
echo -e "${GREEN}║  Demo Accounts:                                             ║${NC}"
echo -e "${GREEN}║    admin@identity.io    / password123                       ║${NC}"
echo -e "${GREEN}║    issuer@identity.io   / password123                       ║${NC}"
echo -e "${GREEN}║    verifier@identity.io / password123                       ║${NC}"
echo -e "${GREEN}║    user@identity.io     / password123                       ║${NC}"
echo -e "${GREEN}║                                                             ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all services                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start both with hot reload using concurrently
npx concurrently \
  --names "API,WEB" \
  --prefix-colors "blue,magenta" \
  --kill-others \
  "npx nodemon --watch server server/index.js" \
  "cd client && npx vite --host"
