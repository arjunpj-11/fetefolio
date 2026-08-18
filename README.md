# Fetefolio — Event Booking Platform

A production-structured MERN application for discovering and requesting venues, stays, caterers, photographers and DJs. The public experience is fully responsive, searchable and availability-led; the provider workspace has dedicated overview, service editor and booking-management pages.

## Quick start (under 10 minutes)

Prerequisites: Node.js 20+, npm 10+, MongoDB 7+, and Redis 7+ running locally.

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run seed
npm run dev
```

Open `http://localhost:5173`. API docs are at `http://localhost:5055/api/docs`.

Demo accounts after seeding:

| Role           | Email                  | Password       |
| -------------- | ---------------------- | -------------- |
| Customer       | `guest@programme.test` | `Programme123` |
| Provider/admin | `admin@programme.test` | `Programme123` |

## Commands

```bash
npm run dev        # frontend and API together
npm run build      # strict TypeScript + production builds
npm test           # backend unit/integration + frontend component tests
npm run typecheck  # strict checks without emitting files
npm run format     # format the project with Prettier
npm run check      # formatting, types, tests and production build
npm run seed       # reset and populate demo data
```

Run one app independently with `npm run dev -w frontend` or `npm run dev -w backend`.

## Deployment

Deploy the two workspaces as separate services after running `npm run check`:

- Serve `frontend/dist` from a static host. Configure an SPA fallback so every application route resolves to `index.html`.
- Run the API with `npm start`. Its health endpoint is `/api/health`.
- Set `VITE_API_URL` to the public HTTPS API URL, including `/api`, before building the frontend.
- Set `CLIENT_URL` to the exact public frontend origin. Configure the remaining production values from `backend/.env.example` in the hosting provider's secret manager.
- Use managed MongoDB and Redis services. Production startup rejects the development JWT and OTP secrets.

## Submission checklist

Submit the source through a Git repository or a clean ZIP. Include `package.json`, `package-lock.json`, `packages/`, `backend/src`, `backend/tests`, `frontend/src`, public assets, configuration files, `README.md` and `docs/`. Exclude `node_modules`, generated `dist` folders, TypeScript build-info files, `.DS_Store` and every real `.env` file. Keep both `.env.example` files so reviewers can configure the project without receiving secrets.

## Environment variables

Backend variables are documented in `backend/.env.example`. Use separate random values of at least 32 characters for `JWT_SECRET` and `OTP_SECRET` in production. Redis is required for pending registrations. For Render Free, set `RESEND_API_KEY` and a verified `MAIL_FROM` sender because Render blocks outbound SMTP ports. SMTP remains available for local development and paid hosts. Without an email provider, local development prints a mail preview and production returns a clear service-unavailable response. Frontend uses `VITE_API_URL` from `frontend/.env.example`.

Admin image uploads use signed direct uploads to Cloudinary. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`; the secret remains server-side and is never returned to the browser.

## Architecture

This repository is an npm workspace:

```text
packages/contracts/  Shared Zod schemas, inferred DTOs, API interfaces
backend/src/modules/ Domain modules: auth, services, bookings, admin
backend/src/shared/  Config, middleware and framework-neutral utilities
frontend/src/features/ Feature-first UI, hooks and stores
frontend/src/shared/   Layouts, guards, components, API client and helpers
docs/                 OpenAPI and study guides
```

Controllers translate HTTP only. Services own business rules. Models own persistence. Zod schemas live once in `@programme/contracts` and provide both runtime validation and TypeScript types to the frontend and backend.

## Important booking and availability behavior

- Date ranges are inclusive: 12–14 October is 3 billable days.
- Price is always recalculated on the server from the stored service rate.
- This is a request-and-approval marketplace, not an automatic single-unit reservation engine. A listing can represent pooled inventory such as several halls or rooms.
- `blockedDateRanges` is the public-availability source of truth. It can represent exhausted pooled inventory, maintenance, or offline bookings.
- A customer cannot submit a new request that overlaps a blocked range. The customer calendar and date-filtered catalogue use the same blocked ranges.
- A confirmed request does not close dates automatically. After verifying real-world availability, the provider decides whether to keep accepting requests or block all/part of the requested range.
- Existing pending requests remain reviewable after a range is blocked, allowing the provider to re-verify inventory and make the final decision.
- Providers can reject pending requests or cancel confirmed bookings with a customer-visible reason and email notification. Cancelling does not automatically reopen blocked dates because the block may represent other inventory conditions.
- Provider ownership is checked in the service layer for edits, deletes and booking views.
- Listings with upcoming pending or confirmed bookings cannot be deleted.

## Search and filters

Customers can combine full-text keyword search with service type, city, inclusive date range, daily-price range and minimum rating. Capacity is displayed only for service types where it makes sense. The API returns category-scoped city metadata for the city selector.

The related endpoints are `GET /api/services/meta/filters?category=venue` and `GET /api/services/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`.

## API examples

Register:

```bash
curl -X POST http://localhost:5055/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Asha Rao","email":"asha@example.com","password":"Programme123"}'
```

The register call returns `202` and sends a six-digit code. Complete account creation with:

```bash
curl -X POST http://localhost:5055/api/auth/verify-registration \
  -H 'Content-Type: application/json' \
  -d '{"email":"asha@example.com","otp":"123456"}'
```

Browse available Jaipur venues:

```bash
curl 'http://localhost:5055/api/services?category=venue&city=Jaipur&date=2026-10-12&page=1&limit=9&sort=priceAsc'
```

Create a booking request (replace the token and service identifier):

```bash
curl -X POST http://localhost:5055/api/bookings \
  -H 'Authorization: Bearer YOUR_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"serviceId":"SERVICE_OBJECT_ID","startDate":"2026-10-12","endDate":"2026-10-14","contactDetails":{"name":"Asha Rao","phone":"+91 98765 43210","email":"asha@example.com"}}'
```

All responses use `{ "success": boolean, "data": T, "message": string }`. See `docs/swagger.yaml` for the complete HTTP contract and `docs/DATABASE_SCHEMA.md` for the persistence schema.

## Security and production notes

- bcrypt cost factor 12; short-lived configurable JWTs; credentials never returned.
- Registration is compulsory two-step verification: Redis stores a hashed password and HMAC OTP digest for 10 minutes, limits attempts/resends, and deletes the pending record after MongoDB account creation.
- Helmet, strict CORS, 100 KB body limits, Mongo operator sanitization and Zod validation.
- Secrets are excluded from source control. In production, terminate TLS at the proxy and use a managed MongoDB replica set.
- Availability is intentionally provider-managed. If the product later owns numerical inventory, add per-date inventory units and atomic reservations rather than inferring stock from booking count.

## Further study

- `docs/ARCHITECTURE.md` — boundaries and request flow
- `docs/BACKEND_STANDARDS.md` — validation, errors, auth and booking correctness
- `docs/FRONTEND_STANDARDS.md` — state split, responsive UI and accessibility
- `docs/TESTING.md` — test strategy and extension guide
- `docs/AUTH_OTP_FLOW.md` — Redis OTP lifecycle, security decisions and operations
