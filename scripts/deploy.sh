#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# AgilePro — deploy.sh
# Run on the VPS to pull latest images / rebuild and restart all services
# Usage: bash /opt/agilepro/scripts/deploy.sh [--build]
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy $(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }

COMPOSE_FILE="/opt/agilepro/docker-compose.prod.yml"
ENV_FILE="/opt/agilepro/.env"

[[ ! -f "$COMPOSE_FILE" ]] && { echo "Error: $COMPOSE_FILE not found"; exit 1; }
[[ ! -f "$ENV_FILE" ]] && { warn ".env not found — copy .env.example and fill it in"; exit 1; }

cd /opt/agilepro

log "Starting deployment…"

# Pull latest git changes (if this is a git repo)
if [ -d .git ]; then
  log "Pulling latest code…"
  git pull origin main
fi

BUILD_FLAG=""
[[ "${1:-}" == "--build" ]] && BUILD_FLAG="--build"

log "Bringing up services (this may take a few minutes on first run)…"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans $BUILD_FLAG

log "Waiting for API to be healthy…"
for i in {1..30}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    log "API healthy ✅"
    break
  fi
  [[ $i -eq 30 ]] && { warn "API health check timed out — check logs: docker compose logs api"; }
  sleep 5
done

log "Cleaning up unused images…"
docker image prune -f --filter "until=24h" 2>/dev/null || true

log ""
log "════════════════════════════"
log "  Deployment complete! 🚀  "
log "════════════════════════════"
log ""
log "Service status:"
docker compose -f "$COMPOSE_FILE" ps
log ""
log "View logs:  docker compose -f $COMPOSE_FILE logs -f [api|frontend|caddy|postgres]"
log "Stop all:   docker compose -f $COMPOSE_FILE down"
