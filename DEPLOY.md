# Deploying AgilePro to Hostinger VPS

> **Time to live:** ~30 minutes on a fresh VPS  
> **Required Hostinger plan:** Any VPS plan (KVM 2 or higher recommended for the Spring Boot build)

---

## What you'll need before starting

- [ ] A Hostinger VPS (KVM 2, 4GB RAM recommended — Spring Boot Maven build needs ~2GB)
- [ ] Your domain/subdomain pointed at the VPS IP (A record)
- [ ] SSH access to the VPS (root password from hPanel)
- [ ] Your secrets ready (Google OAuth client ID/secret, Stripe keys, SMTP credentials)

---

## Option A — Hostinger Docker Manager (Easiest, no CLI needed)

Hostinger's Docker Manager lets you deploy directly from a GitHub repo via their GUI.

### Step 1: Install Docker OS template on your VPS

1. Log into **hPanel** → **VPS** → click **Manage** on your VPS
2. Go to **OS & Panel** → **Change OS**
3. Search for **"Docker"** → select **Ubuntu 24.04 + Docker**
4. Set a new root password → click **Confirm**
5. Wait ~3 minutes for it to provision

### Step 2: Push your code to GitHub

```bash
# On your local machine (where you have the agilepro folder):
cd agilepro
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/agilepro.git
git push -u origin main
```

### Step 3: Deploy via Docker Manager

1. In hPanel → VPS → **Docker** (or **Docker Manager**)
2. Click **"Compose from URL"**
3. Enter your GitHub repo URL
4. Set the compose file path to: `docker-compose.prod.yml`
5. In the **Environment Variables** section, add all variables from `.env.example`
6. Click **Deploy**
7. Watch the build logs — first build takes 5–8 minutes

### Step 4: Configure your domain

1. In hPanel → **Domains** → **Manage** → **DNS Zone**
2. Add/update an **A record**: `@` → your VPS IP
3. Add an **A record**: `www` → your VPS IP
4. DNS propagation takes 5–30 minutes

---

## Option B — Direct SSH Deploy (Most control)

### Step 1: SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Run the one-time setup script

```bash
# Upload and run the setup script:
bash <(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/agilepro/main/scripts/vps-setup.sh)

# Or if you've already uploaded the project:
bash /opt/agilepro/scripts/vps-setup.sh
```

This installs Docker, creates a deploy user, configures UFW firewall, adds swap, and sets up log rotation.

### Step 3: Upload your project

**Option 3a — SCP (simplest):**
```bash
# On your LOCAL machine:
scp -r ./agilepro root@YOUR_VPS_IP:/opt/agilepro
```

**Option 3b — Git clone:**
```bash
# On your VPS:
cd /opt
git clone https://github.com/YOUR_ORG/agilepro.git agilepro
```

### Step 4: Create and fill your .env file

```bash
cd /opt/agilepro
cp .env.example .env
nano .env
```

Fill in all values — see `.env.example` for reference. **Critical fields:**

| Variable | Where to get it |
|---|---|
| `POSTGRES_PASSWORD` | Make up a strong password (20+ chars) |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Your SMTP provider (Gmail App Password) |
| `FRONTEND_URL` | `https://yourdomain.com` |

### Step 5: Update Caddyfile with your domain

```bash
nano /opt/agilepro/Caddyfile
```

Replace every occurrence of `yourdomain.com` with your actual domain, e.g.:
```
agilepro.com, www.agilepro.com {
```

### Step 6: Configure Google OAuth redirect URI

Before the first deploy, add your production callback URL in Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → your OAuth 2.0 Client
3. Add to **Authorized redirect URIs**:
   ```
   https://yourdomain.com/api/auth/oauth2/callback/google
   ```

### Step 7: Configure Stripe webhook

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/registrations/payment/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy the webhook signing secret → paste into `.env` as `STRIPE_WEBHOOK_SECRET`

### Step 8: Launch 🚀

```bash
cd /opt/agilepro
bash scripts/deploy.sh --build
```

First build takes 5–10 minutes (Maven downloads dependencies, npm installs packages).

### Step 9: Verify everything is running

```bash
# Check all containers are healthy
docker compose -f docker-compose.prod.yml ps

# Test API health
curl https://yourdomain.com/api/actuator/health

# Watch live logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Option C — GitHub Actions CI/CD (For ongoing deployments)

Once your VPS is set up and the first manual deploy works, automate future deploys:

### Step 1: Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these **Secrets**:
```
HOSTINGER_API_KEY     (from hPanel → API → Generate key)
POSTGRES_PASSWORD
JWT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MAIL_HOST
MAIL_USERNAME
MAIL_PASSWORD
```

Add these **Variables** (not secret):
```
HOSTINGER_VM_ID       (from hPanel URL: hpanel.hostinger.com/vps/123456/overview → 123456)
FRONTEND_URL          https://yourdomain.com
MAIL_PORT             587
```

### Step 2: Get your Hostinger API key

1. hPanel → top-right avatar → **API**
2. Generate a new API key
3. Add as `HOSTINGER_API_KEY` secret in GitHub

### Step 3: Push to deploy

```bash
git push origin main
```

The workflow in `.github/workflows/deploy.yml` will:
1. Build Docker images and push to GitHub Container Registry
2. Deploy to your Hostinger VPS via the Hostinger GitHub Action
3. Run a smoke test to confirm the API and frontend are responding

---

## Ongoing management

```bash
# View all service logs
docker compose -f docker-compose.prod.yml logs -f

# View just API logs  
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service (e.g. after config change)
docker compose -f docker-compose.prod.yml restart api

# Pull latest and redeploy
bash /opt/agilepro/scripts/deploy.sh

# Rebuild from scratch
bash /opt/agilepro/scripts/deploy.sh --build

# Database backup
docker exec agilepro-db pg_dump -U agilepro agilepro_db > backup_$(date +%Y%m%d).sql

# Check disk usage
df -h && docker system df
```

## Recommended VPS specs

| Traffic | Plan | RAM | Notes |
|---|---|---|---|
| Testing / staging | KVM 1 | 1GB | Use swap, slow builds |
| Small production (<500 users) | KVM 2 | 2GB | Comfortable |
| Medium production (500–5k users) | KVM 4 | 4GB | Recommended |
| Scale | KVM 8+ | 8GB+ | Add DB replica |

## Troubleshooting

**API container exits immediately:**
```bash
docker compose -f docker-compose.prod.yml logs api
# Usually a bad env variable or DB connection issue
```

**HTTPS certificate not provisioning:**
- Ensure your domain's A record points to the VPS IP
- Ensure ports 80 and 443 are open: `ufw status`
- Check Caddy logs: `docker compose logs caddy`

**Out of memory during build:**
- Ensure swap is enabled: `free -h`
- Run setup script again: it creates 2GB swap
- Or increase VPS RAM plan

**OAuth callback failing:**
- Confirm redirect URI in Google Cloud Console matches exactly
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env`
