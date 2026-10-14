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
                         │                 │
                         ▼                 ▼
                  BullMQ → Redis    Prisma → PostgreSQL
```

Redis is only the backend of the BullMQ queues used by payments. Everything that involves money is written to PostgreSQL before it becomes a job, so Redis can lose its data without losing work (see [Payments](#payments)).

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
| `redis` | redis:7-alpine | 6379 | BullMQ queues of the payment flow (`noeviction`) |
| `api` | `backend/Dockerfile` | 8080 | Runs `prisma migrate deploy`, then the API |
| `web` | `frontend/Dockerfile` | 3000 | Next.js app, with `API_URL=http://api:8080` |

## packages/shared

Builds with `tsc` to `dist/`. It is the single source of truth for types that cross the API boundary:

- `user.ts`: `UserTypeEnum` (`ADMIN=1`, `USER=2`, `ORGANIZER=3`), `User`, and `canManageEvents()`, which returns true for admins and organizers.
- `event.ts`: `Event`, `EventCategory`, `PaymentMethod`, `CreateEventProps`, `EVENT_SORT_OPTIONS`.
- `lot.ts`: `Sector`, `Lot`, their input types, `getCurrentLot()` (the lot turnover rule, used by the API to validate purchases and by the frontend to show what is on sale) and `summarizeLots()` (event totals).
- `pagination.ts`: `Page<T>`.
- `metrics.ts`: `OrganizerMetrics`, `DailySales`, `METRICS_PERIOD_OPTIONS`.
- `order.ts`: `Order`, `OrderItem`, `Charge`, their status unions, `CreateOrderInput`, `PayOrderInput` and `MAX_TICKETS_PER_ORDER`.

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
│   ├── event/           controller, event/category/payment-method services, dto, repositories,
│   │                    TicketInventoryService (lot stock, used by sales)
│   ├── sales/           orders, tickets, expiration (domain/, application/, infra/, index.ts)
│   ├── billing/         charges, refunds, disputes, webhooks, gateways (same layout)
│   └── common/errors/   domain error types, DomainErrorFilter, Prisma error helpers
├── shared/              outbox, BullMQ queues, domain event bus, maintenance sweeps,
│                        state machine helper
├── db/                  PrismaService, global PrismaModule, Prisma mock type for tests
├── setup-app.ts         global pipe and filter, shared by main.ts and e2e tests
├── response/            message, pagination and token response classes
└── util/                bcrypt helpers, slug generator
```

`user`, `event` and `auth` follow **Controller → Service → Repository → PrismaService**. `sales` and `billing` follow the layout from `MODELAGEM.md`: `domain/` (rules with no I/O), `application/` (use cases, consumers, workers) and `infra/` (repositories, controllers, gateways). Other modules import them only through their `index.ts`.

In every module:

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
| `InvalidTransitionError` | 409 | A state machine refused a transition (it extends `ConflictError`) |
| `PaymentProviderError` | 502 | The payment provider failed or did not answer |
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
| POST | `/events` | JWT |
| PATCH / DELETE | `/events/:id` | JWT |
| GET / POST | `/orders` | JWT |
| GET | `/orders/:id` | JWT (buyer or admin) |
| POST | `/orders/:id/pay`, `/orders/:id/cancel` | JWT (buyer) |
| POST | `/webhooks/:provider` | Provider signature |
| POST | `/fake-gateway/charges/:chargeId/pay`, `/fake-gateway/charges/:chargeId/dispute`, `/fake-gateway/disputes/:disputeId/close` | None. Only with `PAYMENT_PROVIDER=fake`, outside production |

Sectors and lots travel inside the event payload. `POST /events` requires at least one sector with one lot. On `PATCH /events/:id`, `sectors` replaces the whole list: items with `id` are updated, items without `id` are created and missing ones are deleted, all in one transaction. `DELETE /events/:id` deactivates the event; if it has not started yet, it also cancels its sales (see [Payments](#payments)).

`POST /orders` takes `{ items: [{ lotId, quantity }] }`. `POST /orders/:id/pay` takes `{ method: 'card' | 'pix', paymentToken? }`; the token is required for cards.

The full contract is in Swagger (`/docs`) and in `goldenevents-api-insominia-doc.json`.

### Database

- Schema: `backend/prisma/schema.prisma`. Models: `User`, `UserType`, `Event`, `Sector`, `Lot`, `EventCategory`, `PaymentMethod`, `Ticket`, and for payments `Order`, `OrderItem`, `Charge`, `Refund`, `Dispute`, `WebhookEvent`, `OutboxMessage`, `ProcessedMessage`. Tables and columns are snake_case. Payment tables use UUID keys.
- Fields with a fixed set of values (order, charge, refund, dispute and ticket status, charge method, provider) are native PostgreSQL enums declared in the Prisma schema.
- Money is always an integer in cents: `Lot.price`, `Ticket.price` and `OrderItem.unit_price_cents` (the lot price frozen at purchase), the order and charge `*_cents` columns, `Event.min_price` and the revenue metric. Organizer metrics ignore cancelled tickets.
- Tickets are sold by lot. Each event has sectors, and each sector has lots in order (`position`). Only one lot per sector is on sale: the first one with tickets left whose sales have not ended. If that lot has a future `sales_start`, the sector waits. `Event.capacity`, `quantity_left` and `min_price` are totals of the lots, recalculated in the same transaction as every write; writes lock the event row so concurrent purchases do not compute them from stale reads.
- Migrations: `backend/prisma/migrations/`. Create one with `bunx prisma migrate dev --name <name>` inside `backend/`. Production and Docker apply them with `prisma migrate deploy`.
- Seeds: `backend/prisma/seeds/seed.ts` seeds user types, categories, users, events, orders and payment methods. The order seeds have one order in each situation: paid by card and by Pix, free, with a used ticket, refunded, disputed, expired, cancelled and awaiting payment. Event and order seeds are skipped when `NODE_ENV=test`.

## Payments

Phase 1 of `MODELAGEM.md` (single ticket sales) is implemented. The only provider is the in-memory `FakeGateway`.

### Flow

1. **`POST /orders`** checks the purchase policy (event active and not started, lot is the current one, at most `MAX_TICKETS_PER_ORDER` tickets). In one transaction, it then reserves the stock and creates the order as `awaiting_payment`, with a 10-minute `expires_at`. The reservation decrements `Lot.quantity_left` under the event row lock. A delayed job is scheduled in the `order-expiration` queue. A free order (total 0) is created as `paid` with its tickets and never gets a charge.
2. **`POST /orders/:id/pay`** calls `BillingService.createCharge`. The charge gets the idempotency key `charge:order:<orderId>:<attempt>`. Asking for Pix again returns the same QR code. Switching method cancels the open charge first. A declined card is recorded as `failed` and answered with 422.
3. **Confirmation is asynchronous.** The provider sends a webhook to `POST /webhooks/:provider`. It is verified, saved in `webhook_event` (unique per provider event) and enqueued. The `webhooks` worker asks the provider for the current status, so duplicated or out-of-order events cannot move a charge backwards. It then applies the charge state machine and writes `billing.charge_succeeded` to the outbox in the same transaction. A card approved at once takes the same path from step 3 on.
4. **The outbox relay** publishes new `outbox` rows to the `domain-events` queue every `OUTBOX_POLL_INTERVAL_MS`. Each consumer is idempotent: it records `(consumer, message_id)` in `processed_message` in the same transaction as its effect. The sales consumer marks the order `paid`, stores `paid_charge_id`, issues the tickets (random `code` for the QR) and emits `sales.order_paid`.
5. **Expiration.** The delayed job runs at `expires_at`. It first asks the provider for the current status of the charge. If the charge was paid, it leaves the order to the confirmation flow. Otherwise it cancels the charge, releases the stock and marks the order `expired`.

### Edge cases

| Case | What happens |
|---|---|
| Pix paid after expiration | The charge goes `cancelled → succeeded` (the provider is the source of truth for money). Sales reserves the stock again and delivers the order, or requests a `late_payment` refund if the stock is gone. |
| Two charges paid for one order | The second one gets a `duplicate` refund. |
| Buyer cancels (`POST /orders/:id/cancel`) | Unpaid: the order is cancelled and the stock is released. Paid: allowed within 7 days of the purchase (CDC art. 49), before the event starts and with no used ticket. The tickets are cancelled, the stock goes back on sale and a `buyer_request` refund is requested. |
| Organizer deletes an upcoming event | `events.event_cancelled` is emitted. Sales goes through the orders in batches: unpaid orders are cancelled and paid ones are refunded with the key `refund:event_cancelled:<orderId>`, so running it again never refunds twice. Deleting a past event only hides it. |
| Chargeback | The dispute webhook creates a `dispute` and emits `billing.dispute_opened`. Sales cancels the tickets that were not used. |

Refunds are requested inside the caller's transaction, as a `pending` row plus `billing.refund_requested`. The `RefundExecutor` consumer then calls the provider with the refund's idempotency key.

### Queues

| Queue | Job | Source |
|---|---|---|
| `webhooks` | Process one `webhook_event` | Webhook controller |
| `domain-events` | Deliver one outbox message to its consumers | Outbox relay |
| `order-expiration` | Expire one order | Delayed job created with the order |
| `maintenance` | Sweeps | Job scheduler, every 5 minutes |

Every job uses a deterministic `jobId`, so enqueuing the same work twice is harmless. The maintenance sweep rebuilds lost work from PostgreSQL. It re-enqueues unprocessed webhooks and outbox messages, expires overdue orders, and settles paid charges of expired orders that have no refund. Jobs that exhaust their 8 attempts stay in Redis as `failed`.

### Fake provider

`FakeGateway` (`billing/infra/gateways/fake.gateway.ts`) keeps its state in memory:

- Cards are approved with any token except `tok_declined`.
- Pix stays pending until `POST /fake-gateway/charges/:chargeId/pay`.
- Webhooks are signed with HMAC-SHA256 (`x-fake-signature` header, `FAKE_GATEWAY_WEBHOOK_SECRET`).
- After an API restart it no longer knows the old charges. It still refunds them, because a refund is only requested for charges the database already considers paid.

A real provider is a new class that implements `PaymentGateway` (`billing/domain/gateway-port.ts`), registered in `PAYMENT_GATEWAYS` and added to the `PaymentProvider` enum.

### Differences from `MODELAGEM.md`

- `ticket_types` is the existing `Lot`. Its `quantity_left` is the stock still available (total minus sold minus reserved), so the current lot rule and the event totals keep working unchanged.
- Money columns are `Int` in cents, like the rest of the schema, instead of `bigint`.
- `outbox` has both `published_at` (sent to the queue) and `processed_at` (every consumer ran). This lets the sweep re-enqueue a message that Redis lost after it was published.

### Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `SECRET` | backend | JWT signing key |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `REDIS_URL` | backend | Redis for the BullMQ queues, defaults to `redis://localhost:6379` |
| `PAYMENT_PROVIDER` | backend | Provider for new charges, defaults to `fake` |
| `FAKE_GATEWAY_WEBHOOK_SECRET` | backend | Signs the fake provider webhooks, defaults to `fake-secret` |
| `QUEUE_WORKERS` | backend | `off` disables the queue workers and the outbox relay in this process |
| `OUTBOX_POLL_INTERVAL_MS` | backend | How often the outbox relay polls, defaults to 500 |
| `PORT` | backend | Optional, defaults to 8080 |
| `API_URL` | frontend | Server-side base URL of the API, defaults to `http://localhost:8080` |

Templates live in `backend/.env.example`. Tests use `backend/.env.test`.

## Testing

Only the backend has tests. Both suites use Jest 30 with ts-jest in ESM mode.

| Suite | Command | Files | Needs |
|---|---|---|---|
| Unit | `bun run test` | `backend/src/**/*.spec.ts` | Nothing. Prisma is mocked with `jest-mock-extended`. |
| E2E | `bun run test:e2e` | `backend/test/*.e2e-spec.ts` | Docker. Each file starts a Postgres container with testcontainers, runs migrations and seeds, then calls the API with supertest. `payments.e2e-spec.ts` also starts a Redis container and runs the real workers. |

E2E tests run in band, and tests inside a file depend on the order they run in.

`payments.e2e-spec.ts` covers the Phase 1 acceptance criteria:
- 100 simultaneous purchases for 10 tickets.
- The same webhook delivered 3 times, and an old event arriving after the payment.
- A Pix paid after expiration, with and without stock left.
- A declined card and a duplicate payment.
- Buyer cancellation, event cancellation run twice, and a chargeback.
- Rebuilding the queues after a Redis `FLUSHALL`.

Payment confirmation is asynchronous, so those tests poll the database with `waitFor`.

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
- The frontend checkout still calls `POST /events/:id/buy-ticket`, which was replaced by `/orders`. Buying from the site fails until the checkout is moved to the order flow.
- The only payment provider is the in-memory fake. Nothing sends e-mails on `sales.order_paid` yet.
- `goldenevents-api-insominia-doc.json` is from 2024 and does not cover sectors, lots or orders. Swagger (`/docs`) is up to date.
