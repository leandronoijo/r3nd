# E2E Tests

This directory contains end-to-end tests using Playwright.

## Prerequisites

The application stack must be running before executing E2E tests:

```bash
docker-compose -f src/docker-compose.yml up --build
```

## Running Tests

```bash
npm run test:e2e
```

## Test Data

The backend's hourly cron job will populate facts automatically. If the database is empty when a test runs, the `/api/greetings` endpoint will warm up the database by fetching facts on the first request.

## Selectors

All E2E tests use `data-test-id` selectors exclusively. Never use CSS class selectors or XPath.
