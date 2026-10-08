# Architecture

This document describes how Golden Events is structured today. For the planned payments system, see [MODELAGEM.md](MODELAGEM.md).

## Overview

Golden Events is a monorepo with three workspaces:

| Workspace | Package | Stack |
|---|---|---|
| `frontend/` | `golden-events` | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| `backend/` | `golden-events-api` | NestJS 12, Prisma 5, PostgreSQL 16 |
| `packages/shared/` | `@golden-events/shared` | TypeScript types and enums used by both apps |

```
Browser
   │
   ▼
Next.js (frontend, :3000)
   ├─ Server Components ──fetch──┐
   └─ Server Actions ────fetch──┤
                                ▼
                     NestJS API (backend, :8080)
                     Controller → Service → Repository
                                │
                                ▼
                        Prisma → PostgreSQL
```

Redis is provisioned in `docker-compose.yml` and listed in `backend/.env.example`, but no code uses it yet. It is reserved for the BullMQ payment queue described in `MODELAGEM.md`.

## Tooling

- **Package manager:** Bun 1.4.2 workspaces (`packageManager` in the root `package.json`, lockfile `bun.lock`).
- **Runtime:** Node.js 22. Both Dockerfiles use `node:22`.
- **Task runner:** Turborepo. All root scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `format`) run `turbo run <task>`.
  - Every task depends on `^build`, so `packages/shared` is always built before the apps that import it.
  - `backend/turbo.json` adds `db:generate` (`prisma generate`) as a dependency of `build`, `dev`, `typecheck`, `test` and `test:e2e`.
  - Run a task in one package with `bunx turbo run <task> --filter=<package>`.
- **Docker Compose** (`docker-compose.yml`):

| Service | Image / build | Port | Purpose |
|---|---|---|---|
| `db` | postgres:16-alpine | 5432 | Development database |
| `db-test` | postgres:16-alpine | 5433 | Local test database |
| `redis` | redis:7-alpine | 6379 | Reserved for the payment queue |
| `api` | `backend/Dockerfile` | 8080 | Runs `prisma migrate deploy`, then the API |
| `web` | `frontend/Dockerfile` | 3000 | Next.js app, with `API_URL=http://api:8080` |

## packages/shared

Builds with `tsc` to `dist/`. It is the single source of truth for types that cross the API boundary:

- `user.ts`: `UserTypeEnum` (`ADMIN=1`, `USER=2`, `ORGANIZER=3`), `User`, and `canManageEvents()`, which returns true for admins and organizers.
- `event.ts`: `Event`, `EventCategory`, `PaymentMethod`, `CreateEventProps`, `EVENT_SORT_OPTIONS`.
- `lot.ts`: `Sector`, `Lot`, their input types, `getCurrentLot()` (the lot turnover rule, used by the API to validate purchases and by the frontend to show what is on sale) and `summarizeLots()` (event totals).
- `pagination.ts`: `Page<T>`.
- `metrics.ts`: `OrganizerMetrics`, `DailySales`, `METRICS_PERIOD_OPTIONS`.

When you add a type that both apps need, put it here instead of duplicating it.

## Frontend

### Routing

`frontend/next.config.js` sets `pageExtensions: ['page.tsx', 'page.ts', 'api.ts', 'api.tsx']`. Every file that Next.js treats as a route file must end in one of these, for example `page.page.tsx`, `layout.page.tsx` and `not-found.page.tsx`. Other files in `app/` (such as `providers.tsx`) are ordinary modules.

Routes live in `src/app/`, split into three route groups:

| Group | Layout | Routes |
|---|---|---|
| `(site)` | `SiteShell` (header and footer) | `/`, `/eventos`, `/eventos/[slug]`, `/checkout`, `/meus-ingressos`, `/perfil`, `/seja-organizador` |
| `(auth)` | Split-screen auth layout | `/login`, `/cadastro` |
| `(admin)` | `AdminShell` (sidebar); the layout loads the current user | `/organizador`, `/organizador/meus-eventos`, `/organizador/eventos/criar`, `/organizador/eventos/editar/[slug]`, `/organizador/ingressos-e-vendas`, `/organizador/publico` |

The root `layout.page.tsx` sets the font and the `pt-BR` locale, and wraps the app in `providers.tsx` (`ToastContainer`).

### Source layout (`frontend/src`)

| Folder | Contents |
|---|---|
| `app/` | Routes (see above) and `globals.css` |
| `components/` | Components grouped by feature: `admin/`, `auth/`, `checkout/`, `event-details/`, `events/`, `form/`, `home/`, `layout/`, `organizer/`, `profile/`, `tickets/` |
| `ui/` | Base UI primitives such as `button.tsx` (shadcn style) |
| `services/` | API access and Server Actions (see below) |
| `lib/` | `toastify.ts`, `utils.ts` (`cn`) |
| `utils/` | Formatting, masks, zod schemas (`schemaValidations.ts`), auth cookie name and redirect helpers |
| `styles/theme.css` | Tailwind `@theme` design tokens |

**Styling** uses Tailwind CSS 4 with shadcn conventions on top of `@base-ui/react`, plus `class-variance-authority`, `clsx` and `tailwind-merge`. **Forms** use `react-hook-form` with zod resolvers.

### Talking to the API

The browser never calls the API directly. Every request goes through the Next.js server, so only `API_URL` (server-side) needs to know where the API lives:

- `services/api.ts`:
  - `fetchFromApi(path, fallback, init)` is for reads. It calls `API_URL` (defaults to `http://localhost:8080`). If the request fails it returns the fallback, so a page still renders when the API is down. Public reads use `next: { revalidate }`.
  - `sendToApi(path, method, body, token?)` is for writes. It returns `{ ok, status, data, message }`, or `null` when the API is unreachable.
- `services/authenticated-api.ts`:
  - `fetchWithAuth` is for Server Components. It reads the auth cookie, sends a `Bearer` header and uses `cache: 'no-store'`.
  - `sendWithAuth` is for Server Actions. It wraps `sendToApi` with the auth cookie and returns an `ActionResult` (`{ success, message }`).
- `services/*-actions.ts` are Server Actions (`'use server'`). Client components call them and show `result.message` in a toast. They call `revalidatePath` or `redirect` after a write.

### Authentication

1. `LoginForm` calls the `signIn` Server Action (`services/auth-actions.ts`), which posts to `/login`. On success it sets the auth cookie on the server and redirects to the requested page. The cookie name is `AUTH_COOKIE` from `utils/auth_cookie.ts`. The cookie is `httpOnly` and `sameSite=lax` (`secure` in production), and lasts 1 hour, or 30 days with "keep connected". Client-side JavaScript cannot read the token. `RegisterForm` uses the `signUp` Server Action the same way.
2. `src/proxy.page.ts` is the Next.js 16 proxy (formerly middleware). It only checks that the cookie exists, and redirects to `/login?redirect=...` when it is missing. It covers `/organizador/*`, `/meus-ingressos`, `/perfil` and `/checkout`.
3. Pages validate the token against the API through `services/auth.ts`:
   - `getCurrentUser()` calls `GET /users/token`.
   - `requireUser(redirectTo)` redirects to login when there is no valid user.
   - `requireOrganizer(redirectTo)` also redirects to `/seja-organizador` when `canManageEvents()` is false.
4. `signOut` in `services/auth-actions.ts` deletes the cookie. `utils/auth_redirect.ts` (`getSafeRedirect`) prevents open redirects.

## Backend

### Bootstrap

`backend/src/setup-app.ts` (`setupApp`) holds the global configuration. Both `main.ts` and the e2e tests call it, so tests run with the same rules as the real API:

- A global `ValidationPipe` with `transform`, `whitelist` and `forbidNonWhitelisted`. Every request body must match a `class-validator` DTO.
- The global `DomainErrorFilter` (see [Errors](#errors)).

`backend/src/main.ts` also sets up:

- Swagger UI at `/docs`, with bearer auth.
- CORS, and the port from `PORT` (default 8080).

The backend is ESM (`"type": "module"`, `nodenext`), so relative imports must end in `.js`.

### Modules

```
backend/src/
├── main.ts
├── app/
│   ├── app.module.ts
│   ├── auth/            controller, service, dto, guard/ (jwt, local), strategy/ (jwt, local)
│   ├── user/            controller, service, dto, entities, repositories
│   ├── event/           controller, event/category/payment-method services, dto, repositories
│   └── common/errors/   domain error types, DomainErrorFilter, Prisma error helpers
├── db/                  PrismaService, global PrismaModule, Prisma mock type for tests
├── setup-app.ts         global pipe and filter, shared by main.ts and e2e tests
├── response/            message, pagination and token response classes
└── util/                bcrypt helpers, slug generator
```

Each feature module follows **Controller → Service → Repository → PrismaService**:

- Controllers handle HTTP concerns only.
- Services hold business rules and permission checks.
- Repositories are the only layer that touches Prisma.

Each provider is declared in exactly one module. Declaring it again in another module's `providers` creates a second instance:

- `PrismaModule` is `@Global()` and is imported once in `AppModule`. Feature modules must **not** list `PrismaService` in their `providers`, because that creates another client with its own connection pool.
- `UserModule` exports `UserService`. `AuthModule` imports `UserModule` and owns the passport strategies (`LocalStrategy`, `JwtStrategy`). Other modules only need `JwtAuthGuard` to protect routes.

### Errors

Services throw **domain errors** from `app/common/errors/types/`, never Nest HTTP exceptions. This keeps services usable outside HTTP, for example in the queue workers planned in `MODELAGEM.md`. The global `DomainErrorFilter` (`app/common/errors/filters/`) turns them into HTTP responses:

| Error | Status | Use it when |
|---|---|---|
| `NotFoundError` | 404 | A resource does not exist |
| `ConflictError` / `UniqueConstraintError` | 409 | The data clashes with existing data (for example a duplicated email) |
| `UnauthorizedError` | 401 | The caller is not authenticated |
| `ForbiddenError` | 403 | The caller is authenticated but not allowed |
| `BusinessRuleError` | 422 | The request is valid but breaks a business rule (sold out, event already started) |
| `DatabaseError` | 400 | Any other Prisma error |

Prisma errors are converted first (`handleDatabaseErrors`, for example P2002 becomes `UniqueConstraintError`). Anything else falls through to Nest's default handling. The passport strategies in `auth/strategy/` are the only exception: they belong to the HTTP layer and throw `UnauthorizedException` directly.

### Auth and permissions

- `POST /login` uses `LocalAuthGuard` (passport-local, email and password checked with bcrypt) and returns a JWT signed with the `SECRET` env var. The payload is `{ id, name, email }`.
- Protected routes use `JwtAuthGuard` (passport-jwt, `Bearer` header).
- There is no roles guard. Services receive a `Requester` (`{ id, user_type_id }`) and check permissions themselves. For example:
  - Users can only read or edit their own profile unless they are admins.
  - Only admins can grant the admin type.
  - Only organizers and admins can create events or see metrics.

### Routes

| Method | Path | Auth |
|---|---|---|
| POST | `/login` | Email and password |
| POST | `/users` | Public (signup) |
| GET | `/users`, `/users/types` | Public |
| GET | `/users/token`, `/users/me/tickets`, `/users/:id` | JWT |
| PATCH | `/users/:id`, `/users/:id/active` | JWT |
| GET | `/events`, `/events/categories`, `/events/categories/:id`, `/events/payment-methods`, `/events/slug/:slug`, `/events/:id` | Public |
| GET | `/events/me`, `/events/me/metrics?days=` | JWT |
| POST | `/events`, `/events/:id/buy-ticket` | JWT |
| PATCH / DELETE | `/events/:id` | JWT |

Sectors and lots travel inside the event payload. `POST /events` requires at least one sector with one lot. On `PATCH /events/:id`, `sectors` replaces the whole list: items with `id` are updated, items without `id` are created and missing ones are deleted, all in one transaction. `POST /events/:id/buy-ticket` takes `{ lotId, quantity, paymentMethodId }`.

The full contract is in Swagger (`/docs`) and in `goldenevents-api-insominia-doc.json`.

### Database

- Schema: `backend/prisma/schema.prisma`. Models: `User`, `UserType`, `Event`, `Sector`, `Lot`, `EventCategory`, `PaymentMethod`, `Ticket`. Tables and columns are snake_case.
- Money is always an integer in cents: `Lot.price`, `Ticket.price` (the lot price frozen at purchase), `Event.min_price` and the revenue metric.
- Tickets are sold by lot. Each event has sectors, and each sector has lots in order (`position`). Only one lot per sector is on sale: the first one with tickets left whose sales have not ended. If that lot has a future `sales_start`, the sector waits. `Event.capacity`, `quantity_left` and `min_price` are totals of the lots, recalculated in the same transaction as every write; writes lock the event row so concurrent purchases do not compute them from stale reads.
- Migrations: `backend/prisma/migrations/`. Create one with `bunx prisma migrate dev --name <name>` inside `backend/`. Production and Docker apply them with `prisma migrate deploy`.
- Seeds: `backend/prisma/seeds/seed.ts` seeds user types, categories, users, events and payment methods. Event seeds are skipped when `NODE_ENV=test`.

### Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `SECRET` | backend | JWT signing key |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `REDIS_URL` | backend | Not used yet |
| `PORT` | backend | Optional, defaults to 8080 |
| `API_URL` | frontend | Server-side base URL of the API, defaults to `http://localhost:8080` |

Templates live in `backend/.env.example`. Tests use `backend/.env.test`.

## Testing

Only the backend has tests. Both suites use Jest 30 with ts-jest in ESM mode.

| Suite | Command | Files | Needs |
|---|---|---|---|
| Unit | `bun run test` | `backend/src/**/*.spec.ts` | Nothing. Prisma is mocked with `jest-mock-extended`. |
| E2E | `bun run test:e2e` | `backend/test/*.e2e-spec.ts` | Docker. Each file starts a Postgres container with testcontainers, runs migrations and seeds, then calls the API with supertest. |

E2E tests run in band, and tests inside a file depend on the order they run in.

## Conventions

- **Branches:** `type/short-description` (for example `feat/checkout`, `fix/login-redirect`), opened as PRs into `develop`. `develop` is merged into `main`.
- **Commits:** Conventional Commits, lowercase and imperative (`feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`).
- **Pull requests:** use the template in `.github/pull_request_template.md`.
- **CI:** `.github/workflows/ci.yml` runs on every PR to `develop` or `main`. A PR can only be merged when both jobs pass:
  - `quality`: lint (fails if `eslint --fix` would change any file), typecheck, build and unit tests.
  - `e2e`: backend end-to-end tests against a real Postgres.
- **Lint and format:** each app has its own ESLint flat config and Prettier config. There is no root config.

## Known gaps

- The backend `tsconfig.json` has `strictNullChecks` and `noImplicitAny` turned off. The frontend and shared package are strict.
- `backend/.env.test` is committed and contains a `SECRET`. That is fine for tests, but it must never be reused in other environments.
- The frontend has no automated tests.
- Redis is provisioned but unused.
