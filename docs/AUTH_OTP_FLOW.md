# Registration OTP flow

## Why Redis is used

An unverified visitor is not a user yet. Pending registration data therefore stays outside MongoDB in Redis, where a TTL removes abandoned attempts automatically. Only a successfully verified registration becomes a MongoDB `User`.

## Lifecycle

1. `POST /api/auth/register` validates and normalizes the name, email and password with the shared Zod contract.
2. The API rejects an email that already exists in MongoDB.
3. bcrypt hashes the password with cost factor 12. The plaintext password is never stored in Redis.
4. A cryptographically secure six-digit OTP is generated. Redis receives an HMAC digest of the OTP, never the plaintext code, plus the normalized identity and password hash.
5. The Redis key is a SHA-256 digest of the email and expires after `OTP_TTL_SECONDS` (10 minutes by default).
6. The HTTPS email API sends the OTP when `RESEND_API_KEY` is configured; authenticated SMTP is the fallback. In local development without either provider, the API console prints a mail preview so the flow remains testable.
7. `POST /api/auth/verify-registration` compares OTP digests with `timingSafeEqual`. Invalid attempts are counted; the record is deleted after `OTP_MAX_ATTEMPTS`.
8. On success, the API checks MongoDB again, creates the user with the existing bcrypt hash, deletes the Redis record and returns the normal JWT auth payload.

## Resend protection

`POST /api/auth/resend-registration-otp` requires the pending email and enforces `OTP_RESEND_COOLDOWN_SECONDS`. A resend rotates the OTP, resets failed attempts and starts a fresh expiry. If email delivery fails, the previous Redis record is restored.

## Production setup

- Use TLS-enabled managed Redis and set `REDIS_URL` accordingly.
- Keep `OTP_SECRET` independent from `JWT_SECRET` and rotate it through the secret manager.
- On Render Free, configure `RESEND_API_KEY` and a verified `MAIL_FROM` sender. Free Render web services block outbound SMTP ports 25, 465 and 587.
- On a paid host, authenticated SMTP is also supported. Delivery connections time out quickly so registration requests do not hang indefinitely.
- Monitor HTTP 429 responses and failed verification counts without logging OTP values.
- Redis persistence is optional for this short-lived data; availability and eviction policy are more important. Do not use an eviction policy that silently removes active OTP keys under normal load.

## Data boundaries

MongoDB never receives an unverified user. Redis never receives a plaintext password or plaintext OTP. API responses return only the normalized email and expiry/cooldown metadata until verification succeeds.
