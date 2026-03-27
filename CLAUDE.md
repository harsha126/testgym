# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Iron Addicts Gym Management — a full-stack web app with two roles (OWNER, USER) for managing gym memberships, subscriptions, payments, and notifications.

All source lives under `gym-management/`:
- `backend/` — Spring Boot 3.2.3 / Java 17 / Maven
- `frontend/` — React 19 / TypeScript / Vite / Ant Design v6
- `docker-compose.yml` — orchestrates PostgreSQL, backend, frontend

## Running the App

**Full stack via Docker (production-like):**
```bash
cd gym-management
cp .env.example .env      # first time only
./start.sh                # build & start all services
./start.sh --stop         # stop
./start.sh --logs         # follow logs
```
Frontend: http://localhost | Backend: http://localhost:8080

**Local dev (without Docker):**

Backend — requires PostgreSQL at `localhost:5432/gymdb` (or override via env vars):
```bash
cd gym-management/backend
mvn spring-boot:run
```

Frontend — proxies `/api` to `localhost:8080` automatically:
```bash
cd gym-management/frontend
bun dev     # runs on http://localhost:5173
```

**Build commands:**
```bash
# Backend
mvn clean package -f gym-management/backend/pom.xml

# Frontend
cd gym-management/frontend && bun run build
```

There are no automated tests in this project currently.

## Architecture

### Authentication Flow

- Login returns a short-lived **access token (15 min)** stored in `localStorage` and a **refresh token (7 days)** as an HttpOnly cookie.
- `axiosInstance.ts` intercepts 401 responses, silently calls `POST /api/auth/refresh` (cookie sent automatically via `withCredentials: true`), queues concurrent requests while refreshing, then retries them with the new token.
- All API calls go through the single axios instance at `src/api/axiosInstance.ts`.

### Backend Structure (`com.gym`)

- **`config/`** — `SecurityConfig` (JWT filter chain, public endpoints), `CorsConfig`, `DataSeeder`
- **`security/`** — `JwtTokenProvider` (sign/validate), `JwtAuthenticationFilter` (OncePerRequestFilter)
- **`controller/`** — thin REST layer; owner-only endpoints use `@PreAuthorize("hasRole('OWNER')")`
- **`service/`** — all business logic; `NotificationService` coordinates `WebPushService` + `MockSMSService`
- **`scheduler/`** — `ExpiryCheckerScheduler` runs daily at 9 AM: notifies users 3 days before expiry and on expiry day, then marks subscriptions EXPIRED; also sends a summary push to the OWNER
- **`entity/`** — JPA entities; schema managed entirely by Flyway migrations in `src/main/resources/db/migration/`
- **`exception/`** — `GlobalExceptionHandler` maps domain exceptions to HTTP responses

Key backend config (`application.yml`):
- `app.jwt.expiration-ms: 900000` (15 min access token)
- `app.jwt.refresh-expiration-ms: 604800000` (7 day refresh token)
- VAPID keys for Web Push are in `application.yml` under `app.vapid`
- Default DB: `localhost:5432/gymdb` / `gymuser` / `gympass` (overridden by Docker env vars)

**SMS** is mocked — `MockSMSService` just logs. To add real SMS, implement `SMSService` with `@Profile("production")`.

### Frontend Structure (`src/`)

- **`api/`** — one file per domain (auth, users, subscriptions, payments, notifications, excel); all import from `axiosInstance.ts`
- **`stores/`** — Zustand stores: `authStore` (token + user info), `userStore` (list/search), `subscriptionStore` (current plan + history + payments), `notificationStore` (unread count + list)
- **`pages/`** — `LoginPage`, `OwnerDashboard`, `UserDetailPage`, `UserDashboard`
- **`components/`** — `AppHeader`, `NotificationBell`, `ProtectedRoute`, `SubscriptionModal`
- **`hooks/`** — `useDebounce` (300ms default, used by owner dashboard search)
- **`types/`** — shared TypeScript interfaces
- **`public/sw.js`** — service worker that handles Web Push events; registered on login after notification permission is granted

### Role-Based Routing

- `/login` — public
- `/owner/*` — OWNER role only (`ProtectedRoute` checks JWT role)
- `/user` — USER role only
- After login, users are redirected by role

### Database

PostgreSQL managed with Flyway. Migrations are in `backend/src/main/resources/db/migration/`:
- `V1__init_schema.sql` — tables
- `V2__seed_data.sql` — predefined subscription plans (Monthly/Quarterly/Half-Yearly/Yearly/Custom)
- `V3__refresh_tokens.sql` — refresh_tokens table

Schema uses `last_exported_at` timestamps on `users`, `user_subscriptions`, and `payments` to track incremental Excel exports.

### Excel Import/Export

- `POST /api/excel/import` — owner uploads `.xlsx`; imports users+subscriptions+payments in bulk; default password is last 4 digits of phone + "gym"
- `GET /api/excel/export` — returns only records where `last_exported_at IS NULL OR updated_at > last_exported_at`, then stamps them

### Environment Variables (`.env` in `gym-management/`)

```
POSTGRES_DB=gymdb
POSTGRES_USER=gymuser
POSTGRES_PASSWORD=gympass
BACKEND_PORT=8080
FRONTEND_PORT=80
```
Docker Compose injects these into containers. The `.env` file is gitignored; copy from `.env.example`.
