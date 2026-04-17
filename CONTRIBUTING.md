# Contributing to ConvLens

Thanks for your interest in contributing.

## Quick start

1. Fork and clone the repo
2. Run `docker compose up --build` to start both services
3. Visit http://localhost:3000

## Before submitting a PR

- Frontend: `cd frontend && npm run lint && npm run type-check && npm run build`
- Backend: `cd backend && ruff check app && pytest`
- All checks must pass in CI before merge.

## Adding a new model

Edit `backend/model_registry.yaml`. The Pydantic schema validates on startup —
typos and missing fields fail fast with clear error messages.

## Reporting issues

Open a GitHub issue with: steps to reproduce, expected vs actual behavior, and
your environment (OS, Docker version).
