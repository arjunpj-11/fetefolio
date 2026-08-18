# Backend Standards

## Naming and TypeScript

- Interfaces use the `I` prefix (`IUser`, `IServiceDocument`).
- DTO names end in `DTO`; Mongoose shapes end in `Document` where helpful.
- `strict` TypeScript is enabled; public functions declare return types.
- Runtime DTOs are inferred from Zod rather than hand-copied.

## HTTP conventions

- `201` for created accounts, listings and bookings.
- `400` for malformed or invalid input, `401` for missing/invalid identity, `403` for insufficient role or ownership, `404` for missing records, and `409` for uniqueness/availability conflicts.
- `ApiError` is the only intentional application error shape.
- Async controllers use `asyncHandler`; no repeated `try/catch` blocks are needed.
- Successful responses use `ApiResponse<T>`.

## Authentication and authorization

Passwords are hashed with bcrypt (12 rounds). JWT middleware verifies the signature, then reloads the current user so deleted accounts or changed roles take effect. Role middleware provides coarse access; service-layer provider checks enforce resource ownership.

## Booking workflow and correctness

The API converts date-only inputs into an inclusive UTC interval. It rejects past start dates, loads the current persisted price, checks provider-managed blocked ranges, calculates inclusive days, then creates a pending request. Client totals are previews only.

Blocked-range query:

```text
blocked.startDate <= requested.endDate
AND blocked.endDate >= requested.startDate
```

Confirmed bookings do not automatically consume all availability because one listing can represent pooled inventory. After checking real-world availability, the provider can confirm while keeping dates open or confirm and block a selected range. Providers can reject pending requests and cancel confirmed bookings with a reason. MongoDB indexes support category/city/price search, text search, provider lists and paginated user/provider booking views.
