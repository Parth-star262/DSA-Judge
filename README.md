# DSA Judge

Full-stack coding judge platform with topic-wise DSA problems, Monaco editor, asynchronous BullMQ submissions, Redis result caching, Server-Sent Events (SSE), and complexity estimation.

## Architecture

```text
Browser -> Next.js frontend -> Express API -> PostgreSQL
                              |
                              +-> Redis + BullMQ queue -> standalone judge worker
                                                            |
                                                            +-> judge runtime
                                                            +-> PostgreSQL result
                                                            +-> Redis result cache
                                                            +-> SSE completion event
```

The API accepts submissions and returns a submission ID immediately. The worker processes jobs independently, writes results to PostgreSQL and Redis, and the frontend receives completion updates through SSE. A bounded polling fallback is used only when an SSE connection cannot be established.

## Project Layout

- `backend` - Express API, Prisma data access, BullMQ worker, judge services
- `frontend` - Next.js App Router application with Monaco editor
- `docker-compose.yml` - local production-like API, worker, PostgreSQL, Redis, and frontend stack

## Prerequisites

- Node.js 20+
- PostgreSQL and Redis for non-Docker development
- Docker Desktop for the complete Compose stack
- Judge runtime credentials if using a remote execution provider

## Local Node Setup

```bash
npm run setup
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The API runs on `http://localhost:5001` and the frontend on `http://localhost:3000` by default.

## Docker Compose

The Compose stack starts PostgreSQL, Redis, the API, a dedicated BullMQ judge worker, and a Next.js standalone frontend:

```bash
docker compose up --build
```

The frontend is available at `http://localhost:3001` and the API at `http://localhost:5002`.

## Useful Commands

- `npm run dev:backend` - API only
- `npm run dev:worker` - judge worker only
- `npm run dev:frontend` - frontend only
- `npm run lint` - frontend lint
- `npm run typecheck` - frontend type check
- `npm run db:seed` - seed demo data
- `npm --prefix backend test` - backend tests

## Access Control

Authentication is JWT-based. `User.role` remains the source of truth for enrollment and administrator authorization. The `Enrollment` model records enrollment events for auditability without changing existing role-based behavior.

- `FREE` users receive only level-one hints.
- `ENROLLED` users receive deeper hints and editorials.
- `ADMIN` users can manage problems and view the protected leaderboard.

## Demo Accounts

- Admin: `admin@dsajudge.com` / `admin123`
- Enrolled student: `student@dsajudge.com` / `student123`

Change demo credentials before using a deployed environment.

## Verification Smoke Flow

1. Start the API and worker.
2. Log in with a demo account.
3. Open a problem and run sample/custom input.
4. Submit a solution and verify queued, judging, and completed SSE states.
5. Confirm the result is available from the submission endpoint after completion.
6. Confirm free users cannot access protected hints/editorials.
7. Confirm only administrators can access the leaderboard.
