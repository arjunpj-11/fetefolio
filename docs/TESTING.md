# Testing Guide

## Current suites

Backend Jest/ts-jest:

- inclusive day and total calculations;
- blocked-date overlap behavior and provider-managed availability;
- password hashing/comparison and JWT round-trip;
- booking confirmation, rejection and provider cancellation rules;
- Supertest health, auth validation, service validation/protection and 404 behavior.

Frontend Vitest/Testing Library:

- accessible button interaction;
- keyword/date filters, URL persistence and service navigation;
- customer and provider booking workflows, including cancellation reasons;
- accessible controls, image galleries and service administration.

## Commands

Use `npm test` for everything, `npm test -w backend` or `npm test -w frontend` for one app, and `npm run build` to catch strict type and bundling failures.

## Recommended next tests

For a deployment pipeline, add a MongoDB test container for real persistence integration, then Playwright journeys for registration → filtering → booking and provider create → edit → booking view. Test each journey at 390 px, 768 px and 1440 px viewports.
