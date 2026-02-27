#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# AgilePro Institute — Hostinger VPS First-Time Setup Script
# Run this ONCE on a fresh VPS after SSH-ing in as root
#
# Usage:
#   ssh root@YOUR_VPS_IP
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/agilepro/main/scripts/vps-setup.sh | bash
#   (or upload and run: bash vps-setup.sh)
# ──────────────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
err()  { echo -e "${RED}[error]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && err "Run as root: sudo bash vps-setup.sh"

log "=== AgilePro VPS Setup ==="
log "Ubuntu version: $(lsb_release -rs)"

# ── 1. System updates ─────────────────────────────────────────────────
log "Updating system packages…"
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Docker (skip if already installed) ─────────────────────
if ! command -v docker &>/dev/null; then
  log "Installing Docker CE…"
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  log "Docker installed: $(docker --version)"
else
  log "Docker already installed: $(docker --version)"
fi

# ── 3. Install Git ────────────────────────────────────────────────────
command -v git &>/dev/null || apt-get install -y -qq git

# ── 4. Create deploy user (non-root) ─────────────────────────────────
if ! id "deploy" &>/dev/null; then
  log "Creating deploy user…"
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  mkdir -p /home/deploy/.ssh
  # Copy root's authorized keys so same SSH key works for deploy user
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
  chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
  chown -R deploy:deploy /home/deploy/.ssh
  log "deploy user created"
fi

# ── 5. Create project directory ───────────────────────────────────────
log "Creating /opt/agilepro directory…"
mkdir -p /opt/agilepro
chown deploy:deploy /opt/agilepro

# ── 6. UFW Firewall ───────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  log "Configuring firewall…"
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp    comment "SSH"
  ufw allow 80/tcp    comment "HTTP"
  ufw allow 443/tcp   comment "HTTPS"
  ufw --force enable
  log "Firewall configured"
fi

# ── 7. Fail2ban ───────────────────────────────────────────────────────
apt-get install -y -qq fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# ── 8. Swap (2GB — helps during Maven build on low-RAM VPS) ──────────
if [ ! -f /swapfile ]; then
  log "Creating 2GB swap…"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  log "Swap enabled"
fi

# ── 9. Log rotation for Docker ────────────────────────────────────────
cat > /etc/docker/daemon.json << 'DOCKEREOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
DOCKEREOF
systemctl reload docker

# ── 10. Print summary ─────────────────────────────────────────────────
log ""
log "════════════════════════════════════════"
log "  VPS setup complete!"
log "════════════════════════════════════════"
log ""
log "Next steps:"
log "  1. Upload your project:  scp -r agilepro/ deploy@$(hostname -I | awk '{print $1}'):/opt/agilepro/"
log "     (or: git clone your-repo /opt/agilepro)"
log ""
log "  2. Create your .env:     cp /opt/agilepro/.env.example /opt/agilepro/.env"
log "                            nano /opt/agilepro/.env"
log ""
log "  3. Update Caddyfile:     nano /opt/agilepro/Caddyfile"
log "                            (replace yourdomain.com with your real domain)"
log ""
log "  4. Launch:               cd /opt/agilepro"
log "                            docker compose -f docker-compose.prod.yml up -d --build"
log ""
log "  5. Check health:         docker compose -f docker-compose.prod.yml ps"
log "                            curl http://localhost:8080/actuator/health"
log ""
warn "Point your domain's A record to this VPS IP: $(hostname -I | awk '{print $1}')"
log ""
