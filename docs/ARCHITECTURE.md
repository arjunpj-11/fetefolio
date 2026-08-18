# Architecture Study Guide

## Modular monolith

The deployment is one API process, but code is organized around business domains. Each module owns its model, validators, service, controller and routes. This keeps the ease of one deployment while preserving boundaries that can later become separate services.

## Request flow

```text
HTTP request
  → security middleware
  → Zod validation (shared contract)
  → authentication / role guard
  → thin controller
  → framework-neutral service
  → Mongoose model
  → ApiResponse<T>
  → centralized error middleware
```

Controllers know Express but not Mongoose. Services know business data but never receive `req` or `res`. Models describe persistence and indexes but do not decide authorization or prices.

## Shared contracts

`packages/contracts` is a workspace package. Each input schema is a Zod value and its DTO is `z.infer<typeof schema>`. Both apps compile against the same types and the same runtime definitions, preventing the common drift where frontend and backend validate differently.

## Data ownership

- `User` owns identity and role.
- `Service` points to its provider/admin.
- `Booking` points to both customer and service.
- A service owns manual blocked-date ranges. Those ranges are the authoritative public-availability control and can represent exhausted pooled inventory, maintenance, or offline bookings.
- Bookings use a provider-reviewed request workflow. Confirmation records the provider's decision; the provider separately decides whether remaining pooled inventory permits new requests for those dates.
- Service types are stored independently, so providers can add categories without changing the shared DTO schema. Category filter metadata is currently derived from active service cities.

## State ownership in the browser

Zustand owns durable client state (session and filters). TanStack Query owns everything received from the API. React Hook Form owns temporary form state. Keeping these concerns separate avoids duplicate sources of truth.
