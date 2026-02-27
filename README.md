# AgilePro Institute — Full Stack Platform

**Angular 17 + Spring Boot 3.2 + PostgreSQL**

Enterprise SAFe Agile Coaching platform with secure dual-role authentication, Google OAuth, MFA, Stripe payments, and a full admin dashboard.

---

## 📁 Project Structure

```
agilepro/
├── backend/                          # Spring Boot 3.2 (Java 21)
│   ├── src/main/java/com/agilepro/
│   │   ├── AgilePropApplication.java
│   │   ├── config/
│   │   │   └── SecurityConfig.java   # JWT + OAuth2 + CORS
│   │   ├── controller/
│   │   │   ├── AuthController.java   # /api/auth/**
│   │   │   └── Controllers.java      # Course, Registration, Admin, User
│   │   ├── dto/
│   │   │   └── Dtos.java             # All request/response DTOs
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Course.java
│   │   │   └── Entities.java         # Registration, Cert, Coupon, Waitlist
│   │   ├── enums/                    # Role, AuthProvider, Status enums
│   │   ├── repository/
│   │   │   └── UserRepository.java
│   │   ├── security/
│   │   │   ├── JwtService.java       # Token generation & validation
│   │   │   └── SecurityComponents.java # Filter, OAuth2 handlers, EntryPoint
│   │   └── service/
│   │       └── AuthService.java      # Full auth logic + MFA + lockout
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/
│           └── V1__initial_schema.sql
│
├── frontend/                         # Angular 17 (standalone components)
│   └── src/app/
│       ├── app.config.ts             # provideRouter, HttpClient, interceptors
│       ├── app.routes.ts             # Lazy-loaded routes
│       ├── core/
│       │   ├── guards/
│       │   │   └── guards.ts         # authGuard, adminGuard, noAuthGuard
│       │   ├── interceptors/
│       │   │   └── jwt.interceptor.ts # Auto-attach token + refresh on 401
│       │   ├── models/
│       │   │   └── auth.models.ts    # TypeScript interfaces
│       │   └── services/
│       │       ├── auth.service.ts   # Signals-based auth state
│       │       └── services.ts       # Course, Registration, Admin services
│       └── features/
│           ├── auth/
│           │   ├── user-login/       # Warm cream UI + Google OAuth
│           │   ├── admin-login/      # Dark terminal/fortress UI
│           │   └── oauth-callback/   # Handles Google redirect fragment
│           ├── home/                 # Public landing page
│           ├── certifications/       # All SAFe certs
│           ├── register/             # 5-step registration flow
│           ├── user-portal/          # Authenticated participant area
│           └── admin/                # Full admin dashboard
│
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Java 21+, Maven 3.9+
- Node.js 20+, Angular CLI 17+
- PostgreSQL 15+ (or Docker)

### 1. Start Database
```bash
docker compose up postgres -d
```

### 2. Backend
```bash
cd backend
cp src/main/resources/application.yml.example src/main/resources/application.yml
# Edit: Google OAuth, Stripe, Mail credentials

mvn spring-boot:run
# API available at http://localhost:8080/api
# Swagger UI at http://localhost:8080/api/swagger-ui.html
```

### 3. Frontend
```bash
cd frontend
npm install
ng serve
# App available at http://localhost:4200
```

### 4. Docker (Full Stack)
```bash
cp .env.example .env
# Fill in JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STRIPE_SECRET_KEY

docker compose up --build
```

---

## 🔐 Authentication Architecture

### Two Completely Separate Login UIs

| Feature | User Login (`/login`) | Admin Login (`/admin/login`) |
|---------|----------------------|------------------------------|
| Design | Warm cream, editorial | Dark terminal, monospace |
| Google OAuth | ✅ Full flow | ❌ Not available |
| SSO Options | Google, MS, LinkedIn, Okta | Credentials only |
| MFA | Optional (user-controlled) | **Always enforced** |
| MFA Type | Email OTP | TOTP (Authenticator app) |
| Backup Code | No | Yes (8 codes) |
| Session Length | 1 hour (30-day refresh) | 8 hours |
| Token Storage | sessionStorage | sessionStorage |
| Lockout | 5 attempts → 5 min | 5 attempts → 5 min |
| Audit Log | Basic | Full (IP, device, geo) |

### Google OAuth Flow
```
User clicks "Continue with Google"
  → Angular calls auth.initiateGoogleLogin()
  → Browser redirects to /api/auth/oauth2/authorize/google
  → Spring Boot OAuth2 client → Google accounts.google.com
  → User selects account → grants scopes
  → Google redirects → /api/auth/oauth2/callback/google
  → OAuth2SuccessHandler: upsert user, generate JWT
  → Redirect to /auth/callback#access_token=...&refresh_token=...
  → OAuthCallbackComponent extracts tokens from URL fragment
  → Stores in sessionStorage → navigates to /portal
```

### JWT Token Strategy
```
ACCESS TOKEN:  1h (users) / 8h (admins)  — sessionStorage
REFRESH TOKEN: 7 days                     — localStorage
MFA PENDING:   5 minutes                  — memory only
```

---

## 🔧 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URI: `http://localhost:8080/api/auth/oauth2/callback/google`
4. Set in `application.yml`:
```yaml
spring.security.oauth2.client.registration.google:
  client-id: YOUR_CLIENT_ID
  client-secret: YOUR_CLIENT_SECRET
```

---

## 🗄️ Database Schema

Key tables: `users`, `courses`, `registrations`, `certificates`, `coupons`, `waitlist`, `corporate_groups`, `audit_logs`

Run Flyway migrations automatically on startup (see `V1__initial_schema.sql`).

---

## 💳 Stripe Integration

```bash
# Install Stripe CLI for webhooks in dev
stripe listen --forward-to localhost:8080/api/registrations/payment/webhook
```

Payment flow:
1. `POST /registrations` → create pending registration
2. `POST /registrations/payment/create-intent` → get Stripe clientSecret
3. Stripe.js confirms payment in browser
4. Webhook `payment_intent.succeeded` → confirm registration + trigger certificate + waitlist promotion

---

## 🌍 Multi-Currency

Exchange rates from Open Exchange Rates API (configured in `application.yml`). All prices stored in USD, converted at request time. Stripe handles multi-currency settlement natively.

---

## 🏆 Certificate Issuance Flow

1. Course attendance ≥ 80% confirmed
2. SAFe exam result received (manual or API sync)
3. PDF certificate generated from branded template
4. Emailed to participant + available in portal
5. Unique certificate ID generated (e.g. `SA-2026-08471`)

---

## 📋 API Reference

Full interactive docs: `http://localhost:8080/api/swagger-ui.html`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | None | User login |
| `/auth/admin/login` | POST | None | Admin login (always MFA) |
| `/auth/register` | POST | None | Register new user |
| `/auth/mfa/verify` | POST | MFA Token | Complete MFA |
| `/auth/oauth2/authorize/google` | GET | None | Initiate Google OAuth |
| `/courses/public` | GET | None | List public courses |
| `/registrations` | POST | User JWT | Create registration |
| `/admin/dashboard` | GET | Admin JWT | Dashboard stats |
| `/admin/registrations` | GET | Admin JWT | All registrations |
| `/admin/certificates/issue/{id}` | POST | Admin JWT | Issue certificate |

---

## 🔒 Security Checklist

- [x] BCrypt password hashing (cost factor 12)
- [x] JWT access + refresh token rotation
- [x] TOTP MFA for admins (Google Authenticator)
- [x] Account lockout after 5 failed attempts
- [x] Token stored in sessionStorage (not localStorage)
- [x] HttpOnly refresh tokens (in production, use cookies)
- [x] CSRF disabled (stateless JWT API)
- [x] CORS configured to allowed origins only
- [x] Role-based access control (@PreAuthorize)
- [x] All admin actions audited with IP logging
- [x] Email verification required before login
- [x] Password reset tokens expire in 2 hours
- [x] MFA pending tokens expire in 5 minutes
- [x] OAuth tokens never in query params (URL fragment only)
- [ ] Rate limiting (add Spring Cloud Gateway / Bucket4j)
- [ ] Redis token blocklist for immediate logout
- [ ] IP geolocation anomaly detection

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Spring Boot 3.2 |
| Language | Java 21 |
| Security | Spring Security 6 + JWT (jjwt) |
| OAuth2 | Spring OAuth2 Client + Resource Server |
| MFA/TOTP | GoogleAuth library |
| Database | PostgreSQL 15 |
| ORM | Spring Data JPA / Hibernate |
| Migrations | Flyway |
| Payments | Stripe Java SDK |
| Email | Spring Mail (SMTP) |
| API Docs | SpringDoc OpenAPI 3 |
| Frontend | Angular 17 (Standalone) |
| State | Angular Signals |
| HTTP | HttpClient + JWT interceptor |
| Styling | SCSS (component-scoped) |
| Payments (FE) | @stripe/stripe-js |
| Container | Docker + Docker Compose |
