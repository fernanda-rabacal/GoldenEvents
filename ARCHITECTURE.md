# Architecture

This document describes how Golden Events is structured today. For the planned payments system, see [MODELAGEM.md](MODELAGEM.md).

## Overview

Golden Events is a monorepo with four workspaces:

| Workspace | Package | Stack |
|---|---|---|
| `frontend/` | `golden-events` | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| `backend/` | `golden-events-api` | NestJS 12, Prisma 5, PostgreSQL 16 |
| `packages/shared/` | `@golden-events/shared` | TypeScript types and enums used by both apps |
| `e2e/` | `@golden-events/e2e` | Playwright browser tests that run the site against the real API |

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

Redis holds the BullMQ queues used by payments and the rate limit counters. Everything that involves money is written to PostgreSQL before it becomes a job, so Redis can lose its data without losing work (see [Payments](#payments)).

## Tooling

- **Package manager:** Bun 1.4.2 workspaces (`packageManager` in the root `package.json`, lockfile `bun.lock`).
- **Runtime:** Node.js 22. Both Dockerfiles use `node:22`.
- **Task runner:** Turborepo. All root scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `format`) run `turbo run <task>`.
  - Every task depends on `^build`, so `packages/shared` is always built before the apps that import it.
  - `backend/turbo.json` adds `db:generate` (`prisma generate`) as a dependency of `build`, `dev`, `typecheck`, `test` and `test:e2e`.
  - `e2e/turbo.json` passes through the variables that Playwright and testcontainers need (`LOCALAPPDATA`, `HOME`, `DOCKER_*`, ...). Turborepo's strict env mode would filter them out.
  - Run a task in one package with `bunx turbo run <task> --filter=<package>`.
- **Docker Compose** (`docker-compose.yml`):

| Service | Image / build | Port | Purpose |
|---|---|---|---|
| `db` | postgres:16-alpine | 127.0.0.1:5432 | Development database |
| `db-test` | postgres:16-alpine | 127.0.0.1:5433 | Local test database |
| `redis` | redis:7-alpine | 127.0.0.1:6379 | BullMQ queues of the payment flow (`noeviction`) and rate limit counters |
| `api` | `backend/Dockerfile` | 127.0.0.1:8080 | Runs `prisma migrate deploy`, then the API. The image sets `NODE_ENV=production`; Compose overrides it to `development` and turns on the fake provider |
| `web` | `frontend/Dockerfile` | none | Next.js app, with `API_URL=http://api:8080`. Only `proxy` reaches it |
| `proxy` | nginx:1.27-alpine | 3000 | The site's public port. `docker/nginx.conf` overwrites `X-Forwarded-For` with the connection's address (see [Client IP](#rate-limiting)) |

Every port except the site's is bound to `127.0.0.1`: the databases have fixed passwords and Redis has none.

## packages/shared

Builds with `tsc` to `dist/`. It is the single source of truth for types that cross the API boundary:

- `user.ts`: `UserTypeEnum` (`ADMIN=1`, `USER=2`, `ORGANIZER=3`), `User`, and `canManageEvents()`, which returns true for admins and organizers.
- `event.ts`: `Event`, `EventCategory`, `PaymentMethod`, `CreateEventProps`, `EVENT_SORT_OPTIONS`.
- `lot.ts`: `Sector`, `Lot`, their input types, `getCurrentLot()` (the lot turnover rule, used by the API to validate purchases and by the frontend to show what is on sale), `summarizeLots()` (event totals) and `SectorSales` / `LotSales` (sales per lot for the organizer).
- `pagination.ts`: `Page<T>`.
- `metrics.ts`: `OrganizerMetrics`, `DailySales`, `METRICS_PERIOD_OPTIONS`, `OrganizerSalesSummary` and `SALES_PERIOD_OPTIONS`.
- `order.ts`: `Order`, `OrderItem`, `Charge`, their status unions, `CreateOrderInput`, `PayOrderInput`, `MAX_TICKETS_PER_ORDER` and `OrganizerOrder` (an order as the organizer sees it, with buyer, event and payment method).

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
  - `sendToApi(path, method, body, token?)` is for writes. It returns `{ ok, status, data, message }`, or `null` when the API is unreachable. It sends the browser's IP in `X-Client-IP`, with `INTERNAL_API_KEY` in `X-Internal-Key`, so the API's per-IP limits see the visitor and not the Next.js server (see [Client IP](#rate-limiting)). It reads the request headers, so only Server Actions can call it.
- `services/authenticated-api.ts`:
  - `fetchWithAuth` is for Server Components. It reads the auth cookie, sends a `Bearer` header and uses `cache: 'no-store'`.
  - `sendWithAuth` is for Server Actions. It wraps `sendToApi` with the auth cookie and returns an `ActionResult` (`{ success, message }`).
  - `sendWithAuthForData` does the same and also returns the API's `data`. Use it only when the browser needs that data, since everything an action returns is sent to the browser.
- `services/*-actions.ts` are Server Actions (`'use server'`). Client components call them and show `result.message` in a toast. They call `revalidatePath` or `redirect` after a write.

### Checkout

`/checkout` (`components/checkout/CheckoutForm.tsx`) follows the [payments flow](#flow):

1. **Confirmar compra** creates the order (`POST /orders`) and pays it right away (`POST /orders/:id/pay`). A free order is created as paid and goes straight to the confirmation screen. Boleto is not offered, because the API only charges cards and Pix.
2. **Card:** the card becomes a token in the browser (`lib/card-token.ts`), and only the token reaches the Next.js server. That file stands in for a provider SDK. It checks the number (Luhn), the expiry date and the CVV. The test card `4000 0000 0000 0002` becomes `tok_declined`, which the fake provider declines.
3. **Pix:** the page shows the QR code and the copy-and-paste code from the charge. When `FAKE_GATEWAY_SIMULATOR=on`, a button calls `/fake-gateway/charges/:id/pay`.
4. The confirmation is asynchronous, so the page polls `GET /orders/:id` every 2 seconds until the order is `paid`, and then shows the confirmation screen. If the order expires or is cancelled, the page discards it and the buyer starts again.

The order keeps the reserved quantity and price, and the page shows the time left on the reservation. After a declined card the buyer pays the same order again. The API allows one open order per buyer and event, so the page resumes that order instead of creating another one, even when its lot is no longer on sale. **Cancelar pedido** cancels it and releases the tickets.

### Authentication

1. `LoginForm` calls the `signIn` Server Action (`services/auth-actions.ts`). It posts to `/login` with `keepConnected`, sets two cookies on the server and redirects to the requested page:
   - `AUTH_COOKIE` (`golden_token`) holds the 15-minute access token.
   - `REFRESH_COOKIE` (`golden_refresh`) holds the refresh token.

   Both are `httpOnly` and `sameSite=lax` (`secure` in production), and client-side JavaScript cannot read them. `sessionCookies()` in `utils/auth_cookie.ts` builds them:
   - With "keep connected", the refresh cookie lasts 30 days.
   - Without it, both are browser-session cookies, cleared when the browser closes.

   `RegisterForm` uses the `signUp` Server Action the same way.
2. `src/proxy.page.ts` is the Next.js 16 proxy (formerly middleware). It runs on every page and Server Action, and keeps the session alive. Server Components cannot set cookies, so this is the only place that can renew it before a page renders.
   - When the access token is missing or expires within 60 seconds and there is a refresh cookie, it calls `POST /refresh` (`services/session-refresh.ts`). It writes the new cookies to the response, and also to the forwarded request, so the current render already sees the new token.
   - A refused refresh token clears both cookies.
   - If the API is unreachable, the cookies stay as they are.
   - `/organizador/*`, `/meus-ingressos`, `/perfil` and `/checkout` redirect to `/login?redirect=...` when there is no session.
3. Pages validate the token against the API through `services/auth.ts`:
   - `getCurrentUser()` calls `GET /users/token`.
   - `requireUser(redirectTo)` redirects to login when there is no valid user.
   - `requireOrganizer(redirectTo)` also redirects to `/seja-organizador` when `canManageEvents()` is false.
4. `signOut` in `services/auth-actions.ts` calls `POST /logout`, so the refresh token stops working even if it leaked, and then deletes both cookies. `utils/auth_redirect.ts` (`getSafeRedirect`) prevents open redirects.

`next.config.js` sends security headers on every page: a CSP with `frame-ancestors 'none'`, `base-uri`, `form-action` and `object-src` (no `script-src`, which would need a nonce and dynamic rendering on every page), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS in production. `X-Powered-By` is off.

## Backend

### Bootstrap

`backend/src/setup-app.ts` (`setupApp`) holds the global configuration. Both `main.ts` and the e2e tests call it, so tests run with the same rules as the real API:

- `helmet` security headers. Its CSP drops `upgrade-insecure-requests` outside production, because the API runs on plain http there and the upgrade would break Swagger.
- Express `trust proxy` (see [Client IP](#rate-limiting)).
- A global `ValidationPipe` with `transform`, `whitelist` and `forbidNonWhitelisted`. Every request body must match a `class-validator` DTO.
- The global `DomainErrorFilter` (see [Errors](#errors)).

There is no CORS: the browser never calls the API, only the Next.js server does.

`backend/src/main.ts` also sets up:

- Swagger UI at `/docs`, with bearer auth, outside production only.
- The port from `PORT` (default 8080).

The backend is ESM (`"type": "module"`, `nodenext`), so relative imports must end in `.js`.

### Modules

```
backend/src/
├── main.ts
├── app/
│   ├── app.module.ts
│   ├── auth/            controller, service, dto, guard/ (local), strategy/ (jwt, local), index.ts
│   ├── user/            controller, service, dto, entities, repositories, index.ts
│   ├── event/           events, sectors, lots, categories, payment methods (same layout as sales);
│   │                    TicketInventoryService (lot stock and event data for sales)
│   ├── sales/           orders, tickets, expiration, organizer metrics
│   │                    (domain/, application/, infra/, index.ts)
│   ├── billing/         charges, refunds, disputes, webhooks, gateways (same layout)
│   └── common/
│       ├── auth/        JwtAuthGuard, @CurrentUser(), Requester type, admin policies
│       └── errors/      domain error types, DomainErrorFilter, Prisma error helpers
├── shared/              outbox, BullMQ queues, domain event bus, maintenance sweeps,
│                        rate limit, state machine helper
├── db/                  PrismaService, global PrismaModule, Prisma mock type for tests
├── setup-app.ts         global pipe and filter, shared by main.ts and e2e tests
├── response/            message, pagination and token response classes
└── util/                bcrypt helpers, slug generator
```

`user` and `auth` follow **Controller → Service → Repository → PrismaService**. They have almost no domain rules, so the extra folders would not help. `event`, `sales` and `billing` follow the layout from `MODELAGEM.md`: `domain/` (rules with no I/O), `application/` (use cases, consumers, workers) and `infra/` (repositories, controllers, gateways). The folder layout may differ between modules. The rules below apply to all of them.

#### Module boundaries

- Each module has an `index.ts`, its public facade. Other modules import only from it, never from its internal files. Each facade exports only what other modules use today:

  | Module | Facade exports |
  |---|---|
  | `auth` | `AuthModule` |
  | `user` | `UserModule`, `UserService` |
  | `event` | `EventModule`, `TicketInventoryService`, `EVENT_CANCELLED` |
  | `sales` | `SalesModule`, `SALES_EVENTS` |
  | `billing` | `BillingModule`, `BillingService`, `BILLING_EVENTS` |

- A module never reads or writes another module's tables. To combine data from several modules, call the other module's facade, as `OrganizerSalesService` does with `UserService.findContacts` and `TicketInventoryService.findLotLabels`.
- Code shared by every module lives in `app/common/` (auth guard, `Requester`, errors) or `src/shared/` (outbox, queues, rate limit). It never imports a feature module.
- `no-restricted-imports` in `backend/eslint.config.mjs` fails the lint when a file under `src/` imports another module's internal files. Tests under `test/` are white-box and may import internal files.

#### Layers

- Controllers handle HTTP concerns only: they validate the DTO, read the authenticated user and call a service.
- **DTOs stay at the HTTP edge.** Services and repositories receive plain input types, not `class-validator` classes: `event/application/event-inputs.ts`, `user/user-inputs.ts`, `sales/application/sales-inputs.ts`, or the shared `CreateOrderInput` / `PayOrderInput`. Each DTO `implements` its input type, so the compiler catches a DTO that drifts from what the service expects.
- Services (`application/` in sales and billing) hold business rules and permission checks. Pure rules with no I/O go in `domain/` when the module has one.
- **The service owns the transaction.** When a use case writes through several repositories or modules, or emits an outbox event, the service opens `prisma.$transaction` and passes `tx` to the repositories and to other modules' facades (for example `TicketInventoryService.reserve(tx, ...)`). A repository may open its own transaction only for a write that stays in its own tables, such as `EventRepository.update` locking the event while it syncs sectors and lots. Repositories run the queries and are the only layer that builds Prisma queries.
- **Domain events are emitted by services.** `outbox.add(tx, ...)` is called from the service, in the same transaction as the change it announces, never from a repository.
- Permission checks take a `Requester` (`{ id, user_type_id }`, from `app/common/auth/`), not a bare user id. Controllers read it with `@CurrentUser()`, never from `req.user`.

Each provider is declared in exactly one module. Declaring it again in another module's `providers` creates a second instance:

- `PrismaModule` is `@Global()` and is imported once in `AppModule`. Feature modules must **not** list `PrismaService` in their `providers`, because that creates another client with its own connection pool.
- `UserModule` exports `UserService`. `AuthModule` imports `UserModule` and owns the passport strategies (`LocalStrategy`, `JwtStrategy`). Other modules protect routes with `JwtAuthGuard` from `app/common/auth/`. It lives there, not in `auth/`, because `AuthModule` depends on `UserModule`: importing the guard through the `auth` facade from `UserController` would create an import cycle.

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
| `TooManyRequestsError` | 429 | A rate limit was exceeded. The filter also sets `Retry-After` |
| `DatabaseError` | 400 | Any other Prisma error |

Prisma errors are converted first (`handleDatabaseErrors`, for example P2002 becomes `UniqueConstraintError`). Anything else falls through to Nest's default handling. The passport strategies in `auth/strategy/` are the only exception: they belong to the HTTP layer and throw `UnauthorizedException` directly.

### Auth and permissions

- `POST /login` uses `LocalAuthGuard` (passport-local, email and password checked with bcrypt). It returns `{ token, type, refreshToken, keepConnected }`:
  - `token` is a 15-minute JWT signed with the `SECRET` env var. Its payload is `{ id, name, email }`.
  - `refreshToken` is an opaque random token.

  The lifetimes are `ACCESS_TOKEN_TTL_SECONDS` and `REFRESH_TOKEN_TTL_SECONDS` in `packages/shared`.
- Refresh tokens live in the `refresh_token` table, and only their SHA-256 hash is stored. Each login starts a family (`family_id`).
  - `POST /refresh` marks the token as rotated (`rotated_at`) and returns a new pair in the same family. The new token expires 1 day, or 30 days with `keepConnected`, after this renewal, so an active session never ends.
  - Reusing a rotated token deletes the whole family, because it means the token was copied. The exception is reuse within `REFRESH_REUSE_GRACE_MS` (30 s), which is accepted: parallel requests from the browser renew with the same token.
  - `POST /logout` deletes the family. Ending a session always deletes the tokens instead of marking them, because a marked token would still pass the grace window.
  - A password change deletes all of the user's refresh tokens in the same update. A deactivated user's refresh is refused.
  - Each login deletes that user's expired tokens.
- Deactivated users cannot log in. When the email does not exist, bcrypt still runs against a dummy hash, so the response time does not reveal which emails have an account.
- Protected routes use `JwtAuthGuard` (passport-jwt, `Bearer` header). On every request, `AuthService.validateSession` rejects the token if the user was deactivated or changed the password after the token was issued (`User.password_changed_at`, compared with `iat` in seconds).
- Passwords have 8 to 72 characters (`PASSWORD_MIN_LENGTH` / `PASSWORD_MAX_LENGTH`; bcrypt ignores anything past 72 bytes). Changing it requires `currentPassword`, and only the user can change their own password.
- There is no roles guard. Controllers get the `Requester` (`{ id, user_type_id }`) with `@CurrentUser()`. The decorator copies only those two fields from `req.user`, and answers 401 when the route has no `JwtAuthGuard`. Services receive it and check permissions themselves, using `isAdmin` / `assertAdmin` from `app/common/auth/policies.ts` and `canManageEvents` from `packages/shared`. For example:
  - Users can only read or edit their own profile unless they are admins.
  - Only admins can list the users (`GET /users` returns emails and CPFs) and activate or deactivate accounts. Admins cannot deactivate themselves.
  - Only admins can grant the admin type.
  - Only organizers and admins can create events or see metrics.

### Rate limiting

`shared/rate-limit/` keeps fixed-window counters in Redis (`rate-limit:<rule>:<subject>`). There is no global limit: each rule protects one abuse case.

| Rule | Where | Subject | Limit | Counts |
|---|---|---|---|---|
| `login-ip` | `@RateLimit` on `POST /login` | IP | 20 / minute | Every attempt, before bcrypt runs |
| `login-failures` | `AuthService.authenticate` | Email | 5 / 15 minutes | Wrong passwords only. A successful login clears it |
| `refresh-ip` | `@RateLimit` on `POST /refresh` | IP | 60 / minute | Every attempt. The proxy forwards the browser's IP |
| `signup` | `@RateLimit` on `POST /users` | IP | 10 / hour | Every attempt |
| `orders-create` | `@RateLimit` on `POST /orders` | User | 10 / minute | Every attempt, refused ones included |
| `orders-pay` | `@RateLimit` on `POST /orders/:id/pay` | User | 10 / minute | Every attempt |
| `declined-cards` | `BillingService.createCharge` | Customer | 5 / hour | Declined cards only. Pix is still accepted |
| `current-password-failures` | `UserService.update` | User | 5 / 15 minutes | Wrong `currentPassword` only, so a stolen token cannot be used to guess the password |

- `@RateLimit` adds `RateLimitGuard` to the route. Guards on the same method run bottom-up, so `@RateLimit` goes below `@UseGuards(LocalAuthGuard)` on the login. Per-user rules need `JwtAuthGuard` to run first, which the class-level guard of `OrdersController` does.
- Rules that only count failures call `assertAllowed` before the attempt and `recordFailure` after it fails.
- Webhooks have no limit. Providers send them in bursts and treat a 429 as a failure, and the signature check already rejects forged requests cheaply.
- If Redis is down, the request goes through and a warning is logged. The limiter uses its own connection with a 500 ms timeout, because the BullMQ connection waits forever.
- `RATE_LIMIT=off` disables every rule (the e2e tests do this, except `rate-limit.e2e-spec.ts`).

Sales also allows **one open order per buyer and event**. Every unpaid order holds stock for 10 minutes, so without this rule a single account could reserve a whole event. The check runs after the stock reservation, which locks the event row, so simultaneous orders of the same buyer cannot both pass it. Free orders are not affected, because they are paid at once. In the same transaction, a buyer can hold at most `MAX_TICKETS_PER_BUYER_PER_EVENT` (10) tickets per event, adding up paid orders, the open order and the new one. This applies to free orders too.

**Client IP.** Per-IP rules use `clientIp()` (`shared/rate-limit/client-ip.ts`):

- **From the Next.js server.** `sendToApi` sends the browser's IP in `X-Client-IP` and the shared secret `INTERNAL_API_KEY` in `X-Internal-Key`. The API uses `X-Client-IP` only when the key matches (compared in constant time) and the value is a valid IP. This does not depend on the Next.js server's address, which Vercel does not keep fixed. With `NODE_ENV=production`, the API does not start without a key of at least 32 characters (`openssl rand -hex 32`). Without it, every visitor would share the Next.js server's limit.
- **Anything else** (a direct call to the API, or a wrong key) uses `req.ip`. `setupApp` sets Express `trust proxy` from `TRUST_PROXY` (default `loopback`), so `X-Forwarded-For` is only read when the connection comes from the proxy in front of the API. `TRUST_PROXY` accepts `true`, a number of hops, or a list of addresses.

`sendToApi` takes the browser's IP from the last entry of the `X-Forwarded-For` that Next.js receives. Next.js keeps any `X-Forwarded-For` the browser sends: it only fills the header in when it is missing. So Next.js must never be reachable directly, and the proxy in front of it must overwrite the header, or append to it as the only proxy. In Docker Compose that is `proxy` (`docker/nginx.conf`, `proxy_set_header X-Forwarded-For $remote_addr`); the `web` service publishes no port. Vercel overwrites the header itself. The nginx config passes `$http_host` with the port as `Host`, because Server Actions refuse requests whose `Origin` does not match it.

Per host:

| Where | Settings |
|---|---|
| Docker Compose | `INTERNAL_API_KEY` is the same fixed development value on `api` and `web`. `TRUST_PROXY` keeps the default: nothing sits in front of the API |
| Vercel (Next.js) | Set `INTERNAL_API_KEY` and `API_URL` in the project's environment variables. No proxy to add |
| Railway (API) | `INTERNAL_API_KEY`, the same as Vercel's, and `TRUST_PROXY=true`. Railway's edge overwrites `X-Forwarded-For`, so its leftmost entry is the client, and it has no fixed address range to list. After deploying, send a fake `X-Forwarded-For` straight to the API and check that the limit still counts your real IP |
| AWS behind an ALB (API) | `TRUST_PROXY=1`. The ALB appends the connection's address by default, so the rightmost entry is the client. If Next.js also moves to AWS, its ALB works the same way for `sendToApi` |

### Routes

| Method | Path | Auth |
|---|---|---|
| POST | `/login` | Email and password |
| POST | `/refresh`, `/logout` | Refresh token in the body |
| POST | `/users` | Public (signup) |
| GET | `/users/types` | Public |
| GET | `/users` | JWT (admin) |
| GET | `/users/token`, `/users/me/tickets`, `/users/:id` | JWT |
| PATCH | `/users/:id` | JWT |
| PATCH | `/users/:id/active` | JWT (admin) |
| GET | `/events`, `/events/categories`, `/events/categories/:id`, `/events/payment-methods`, `/events/slug/:slug`, `/events/:id` | Public |
| GET | `/events/me`, `/events/me/metrics?days=` | JWT |
| GET | `/events/:id/lots/sales` | JWT (the event organizer) |
| POST | `/events` | JWT |
| PATCH / DELETE | `/events/:id` | JWT |
| GET / POST | `/orders` | JWT |
| GET | `/orders/organizer?event_id=&days=&status=&search=&buyer_id=&skip=&take=`, `/orders/organizer/summary?event_id=&days=` | JWT (organizer; only orders of their own events) |
| GET | `/orders/organizer/audience?event_id=&search=&segment=&sort=&skip=&take=`, `/orders/organizer/audience/summary?event_id=` | JWT (organizer; one row per buyer with a paid order in their events) |
| GET | `/orders/:id` | JWT (buyer or admin) |
| POST | `/orders/:id/pay`, `/orders/:id/cancel` | JWT (buyer) |
| POST | `/webhooks/:provider` | Provider signature |
| POST | `/fake-gateway/charges/:chargeId/pay`, `/fake-gateway/charges/:chargeId/dispute`, `/fake-gateway/disputes/:disputeId/close` | None. Only with `PAYMENT_PROVIDER=fake` and `FAKE_GATEWAY_SIMULATOR=on` |

`GET /users/me/tickets`, `GET /events/me/metrics` and `GET /events/:id/lots/sales` are served by the `sales` module (`TicketsController` and `OrganizerMetricsController`), because they read tickets. They kept their paths so the API did not change.

Sectors and lots travel inside the event payload. `POST /events` requires at least one sector with one lot. On `PATCH /events/:id`, `sectors` replaces the whole list: items with `id` are updated, items without `id` are created and missing ones are deleted, all in one transaction. `DELETE /events/:id` deactivates the event; if it has not started yet, it also cancels its sales (see [Payments](#payments)).

`POST /orders` takes `{ items: [{ lotId, quantity }] }`. `POST /orders/:id/pay` takes `{ method: 'card' | 'pix', paymentToken? }`; the token is required for cards.

The full contract is in Swagger (`/docs`) and in `goldenevents-api-insominia-doc.json`.

### Database

- Schema: `backend/prisma/schema.prisma`. Models: `User`, `UserType`, `RefreshToken`, `Event`, `Sector`, `Lot`, `EventCategory`, `PaymentMethod`, `Ticket`, and for payments `Order`, `OrderItem`, `Charge`, `Refund`, `Dispute`, `WebhookEvent`, `OutboxMessage`, `ProcessedMessage`. Tables and columns are snake_case. Payment tables use UUID keys.
- Fields with a fixed set of values (order, charge, refund, dispute and ticket status, charge method, provider) are native PostgreSQL enums declared in the Prisma schema.
- Money is always an integer in cents: `Lot.price`, `Ticket.price` and `OrderItem.unit_price_cents` (the lot price frozen at purchase), the order and charge `*_cents` columns, `Event.min_price` and the revenue metric. Organizer metrics ignore cancelled tickets.
- Tickets are sold by lot. Each event has sectors, and each sector has lots in order (`position`). Only one lot per sector is on sale: the first one with tickets left whose sales have not ended. If that lot has a future `sales_start`, the sector waits. `Event.capacity`, `quantity_left` and `min_price` are totals of the lots, recalculated in the same transaction as every write; writes lock the event row so concurrent purchases do not compute them from stale reads.
- Migrations: `backend/prisma/migrations/`. Create one with `bunx prisma migrate dev --name <name>` inside `backend/`. Production and Docker apply them with `prisma migrate deploy`.
- Seeds: `backend/prisma/seeds/seed.ts` seeds user types, categories, users, events, orders and payment methods. The order seeds have one order in each situation: paid by card and by Pix, free, with a used ticket, refunded, disputed, expired, cancelled and awaiting payment. Event and order seeds are skipped when `NODE_ENV=test`. With `NODE_ENV=production` the seed only creates the reference data (user types, categories and payment methods): the sample users share the password `123456`, an admin included.

## Payments

Phase 1 of `MODELAGEM.md` (single ticket sales) is implemented. The only provider is the in-memory `FakeGateway`.

### Flow

1. **`POST /orders`** checks the purchase policy (event active and not started, lot is the current one, at most `MAX_TICKETS_PER_ORDER` tickets). In one transaction, it then reserves the stock, checks that the buyer has no other open order for the event (see [Rate limiting](#rate-limiting)) and creates the order as `awaiting_payment`, with a 10-minute `expires_at`. The reservation decrements `Lot.quantity_left` under the event row lock. A delayed job is scheduled in the `order-expiration` queue. A free order (total 0) is created as `paid` with its tickets and never gets a charge.
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

It approves almost any card, so everything around it fails closed:

- `GatewayRegistry` stops the API at startup when `PAYMENT_PROVIDER` is missing or unknown, and when it is `fake` with `NODE_ENV=production`. The backend image sets `NODE_ENV=production`, so production needs `PAYMENT_PROVIDER=stripe`.
- The `/fake-gateway` simulator answers only with `PAYMENT_PROVIDER=fake` and `FAKE_GATEWAY_SIMULATOR=on`. Forgetting a variable leaves it closed.

A real provider is a new class that implements `PaymentGateway` (`billing/domain/gateway-port.ts`), registered in `PAYMENT_GATEWAYS` and added to the `PaymentProvider` enum.

### Stripe provider

`StripeGateway` (`PAYMENT_PROVIDER=stripe`) maps each charge to a PaymentIntent, without `payment_method_types`: the methods come from the Dashboard settings.

- Card: the checkout renders the Payment Element and sends only a ConfirmationToken as `paymentToken`. The API creates the PaymentIntent with the charge idempotency key and confirms it in a separate call, so a retry after a timeout reuses the same intent. When the bank asks for 3D Secure, `POST /orders/:id/pay` returns a pending charge with `client_secret` (never stored) and the browser finishes with `stripe.handleNextAction`.
- Pix: confirmed on the server with `payment_method_data[type]=pix`, expiring with the order. `pix_qr_code` is the copy-paste code from `next_action.pix_display_qr_code`. Pix must be enabled in the Dashboard.
- Webhooks: point an endpoint to `/webhooks/stripe` with `payment_intent.*`, `refund.created`, `refund.updated`, `refund.failed` and `charge.dispute.*`. Only the event and object ids are stored; other event types are acknowledged and dropped. Locally, `stripe listen --forward-to localhost:8080/webhooks/stripe` prints the signing secret.

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
| `NODE_ENV` | backend | `production` hides Swagger, refuses the fake provider and keeps the sample users out of the seed. The backend image sets it |
| `PAYMENT_PROVIDER` | backend | Provider for new charges. Required: the API does not start without it |
| `FAKE_GATEWAY_SIMULATOR` | backend, frontend | `on` opens the `/fake-gateway` routes and shows the Pix payment simulator in the checkout. `.env.test` sets it; Docker Compose reads it from `backend/.env` and `frontend/.env.local` |
| `FAKE_GATEWAY_WEBHOOK_SECRET` | backend | Signs the fake provider webhooks, defaults to `fake-secret` |
| `STRIPE_SECRET_KEY` | backend | Restricted key (`rk_`) for the Stripe API. Required with `PAYMENT_PROVIDER=stripe` |
| `STRIPE_WEBHOOK_SECRET` | backend | Signing secret (`whsec_`) of the Stripe webhook endpoint. Required with `PAYMENT_PROVIDER=stripe` |
| `STRIPE_PUBLISHABLE_KEY` | frontend | Publishable key (`pk_`). When set, the checkout card form is the Stripe Payment Element |
| `QUEUE_WORKERS` | backend | `off` disables the queue workers and the outbox relay in this process |
| `OUTBOX_POLL_INTERVAL_MS` | backend | How often the outbox relay polls, defaults to 500 |
| `RATE_LIMIT` | backend | `off` disables the rate limits. `.env.test` sets it |
| `TRUST_PROXY` | backend | Express `trust proxy` for the proxy in front of the API: `true`, a number of hops or a list of addresses. Defaults to `loopback` |
| `INTERNAL_API_KEY` | backend, frontend | Shared secret that lets the Next.js server send the browser's IP. Same value on both. Required in production, at least 32 characters |
| `PORT` | backend | Optional, defaults to 8080 |
| `API_URL` | frontend | Server-side base URL of the API, defaults to `http://localhost:8080` |

Templates live in `backend/.env.example`. Tests use `backend/.env.test`.

## Testing

The backend suites use Jest 30 with ts-jest in ESM mode. The browser suite uses Playwright.

| Suite | Command | Files | Needs |
|---|---|---|---|
| Unit | `bun run test` | `backend/src/**/*.spec.ts` | Nothing. Prisma is mocked with `jest-mock-extended`. |
| E2E | `bun run test:e2e` | `backend/test/*.e2e-spec.ts` | Docker. Each file starts a Postgres container with testcontainers, runs migrations and seeds, then calls the API with supertest. `payments.e2e-spec.ts` also starts a Redis container and runs the real workers. `rate-limit.e2e-spec.ts` starts Redis too and is the only file with the rate limits on. |
| Browser E2E | `bun run test:e2e` | `e2e/tests/*.spec.ts` | Docker and Chromium (`bunx playwright install chromium`, once). See [Browser E2E](#browser-e2e). |

E2E tests run in band, and tests inside a file depend on the order they run in.

`payments.e2e-spec.ts` covers the Phase 1 acceptance criteria:
- 100 simultaneous purchases for 10 tickets, by 100 buyers, and simultaneous orders of one buyer for the same event.
- The same webhook delivered 3 times, and an old event arriving after the payment.
- A Pix paid after expiration, with and without stock left.
- A declined card and a duplicate payment.
- Buyer cancellation, event cancellation run twice, and a chargeback.
- Rebuilding the queues after a Redis `FLUSHALL`.

Payment confirmation is asynchronous, so those tests poll the database with `waitFor`.

`user.e2e-spec.ts` covers the admin-only routes, the token lifetimes, refresh token rotation, reuse and logout, sessions ended by a deactivation or a password change, and the helmet headers.

### Browser E2E

`bun run test:e2e` runs the backend suites and the browser suite. To run only the browser suite, use `bunx turbo run test:e2e --filter=@golden-events/e2e`. Extra arguments go to Playwright, for example `-- --ui`, `-- --headed` or `-- tests/checkout-pix.spec.ts`.

`e2e/scripts/run.ts` starts everything before calling Playwright, because Playwright's `webServer` starts before `globalSetup`:
1. Postgres and Redis containers (testcontainers).
2. `prisma migrate deploy` and the seed with `NODE_ENV=test`, so the database has the seed users and no events.
3. The built API on `:8090`, with the fake provider and the simulator on and the rate limits off.
4. `next start` on `:3100`, pointing at that API.

The servers write their output to `e2e/.logs/`. Everything is stopped at the end, and new containers are created on each run.

Each test creates its own users and events through the API, so the tests run in parallel without sharing state. Logged-in tests set only the `golden_token` cookie, which lasts long enough for one test. `auth.spec.ts` goes through the real signup and login forms.

| Spec | Covers |
|---|---|
| `auth.spec.ts` | Signup, login, the redirect back to a protected page, a wrong password, the cookie lifetimes with and without "keep connected", renewal of an expired session, and that a refresh token stops working after logout |
| `checkout-card.spec.ts` | Approved card through to Meus ingressos, a declined card followed by a new attempt, and card validation in the browser |
| `checkout-pix.spec.ts` | Pix paid through the simulator, and switching from Pix to card |
| `checkout-order.spec.ts` | Resuming an open order, cancelling it, and a free event |
| `organizer.spec.ts` | Creating an event in the dashboard, buying a ticket for it, and the sale showing in the metrics, in the order details and in the lot progress of `/organizador/ingressos-e-vendas`. Also that buyers are kept out of `/organizador` |

Selectors use roles, labels and visible text. There is no `data-testid`. Toasts are found with the `toast()` helper, because Next's route announcer also has `role="alert"`.

On a failure, Playwright keeps a trace and a screenshot in `e2e/test-results/` and writes the report to `e2e/playwright-report/`. CI uploads both, along with `e2e/.logs/`.

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
- The frontend has no unit tests. It is covered only by the browser E2E suite.
- Stripe Connect (split with the organizers) is not built yet: every Stripe charge settles on the platform. Nothing sends e-mails on `sales.order_paid` yet.
- `goldenevents-api-insominia-doc.json` is from 2024 and does not cover sectors, lots or orders. Swagger (`/docs`) is up to date.
- The production deploy must keep Next.js behind a proxy that overwrites `X-Forwarded-For` (see [Client IP](#rate-limiting)). Vercel and Docker Compose do this, but nothing in the code can enforce it.
- On Railway, `TRUST_PROXY=true` relies on the edge overwriting `X-Forwarded-For`. Railway staff confirm it, but the docs do not promise it. It only affects direct calls to the API: requests from the site use `X-Client-IP`.
- `POST /users` answers 409 for an email or CPF that is already registered, which tells a visitor that the account exists. The signup rate limit slows this down. Fixing it needs email confirmation, which the project does not have yet.
- The site's CSP has no `script-src`: restricting scripts needs a per-request nonce, which turns every page into dynamic rendering.
