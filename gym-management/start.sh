#!/bin/bash
# =============================================================
#  Gym Management — Start / Stop script
#  Usage:
#    ./start.sh          Build & start all services
#    ./start.sh --stop   Stop all services
#    ./start.sh --logs   Follow container logs
# =============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ---- Colours ----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Colour

# ---- Functions ----

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    if ! docker info &> /dev/null 2>&1; then
        echo -e "${RED}✗ Docker daemon is not running. Please start Docker Desktop.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is running${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker compose down
    echo -e "${GREEN}✓ All services stopped${NC}"
}

show_logs() {
    docker compose logs -f
}

start_services() {
    check_docker

    echo ""
    echo -e "${YELLOW}🏗  Building and starting Gym Management services...${NC}"
    echo ""

    docker compose up --build -d

    echo ""
    echo -e "${GREEN}✓ All services are starting up!${NC}"
    echo ""
    echo "  Waiting for services to become healthy..."

    # Wait for containers to be ready (up to 120s)
    TIMEOUT=120
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' gym-backend 2>/dev/null || echo "starting")
        POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' gym-postgres 2>/dev/null || echo "starting")

        if [ "$BACKEND_HEALTH" = "healthy" ] && [ "$POSTGRES_HEALTH" = "healthy" ]; then
            break
        fi

        sleep 3
        ELAPSED=$((ELAPSED + 3))
        echo -n "."
    done
    echo ""

    echo ""
    echo -e "${GREEN}══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🏋️  Iron Addicts Gym Management is LIVE!${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Frontend  →  ${GREEN}http://localhost${NC}"
    echo -e "  Backend   →  ${GREEN}http://localhost:8080${NC}"
    echo -e "  Database  →  ${GREEN}localhost:5432${NC}"
    echo ""
    echo -e "  Stop:  ${YELLOW}./start.sh --stop${NC}"
    echo -e "  Logs:  ${YELLOW}./start.sh --logs${NC}"
    echo ""
}

# ---- Main ----

case "${1:-}" in
    --stop)
        stop_services
        ;;
    --logs)
        show_logs
        ;;
    *)
        start_services
        ;;
esac
