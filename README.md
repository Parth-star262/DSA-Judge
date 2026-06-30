# DSA Judge

Full-stack coding judge platform with topic-wise DSA problems, Monaco editor, async submissions, verdict polling, and complexity estimation.

## Project Layout

- `backend` - Express API, Prisma, synchronous judge service, Redis caching
- `frontend` - Next.js app (App Router) with Monaco editor integration

## Prerequisites

- Node.js 20+
- PostgreSQL
- Redis
- Judge0 RapidAPI key

## Quick Setup

1. Install all dependencies:

```bash
npm run setup
```

2. Configure env files:

```bash
copy backend\\.env.example backend\\.env
copy frontend\\.env.local.example frontend\\.env.local
```

3. Initialize Prisma client and schema:

```bash
npm run db:generate
npm run db:push
```

4. Seed initial data:

```bash
npm run db:seed
```

5. Start everything (API + Worker + Frontend):

```bash
npm run dev
```

## URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

## Useful Commands

- `npm run dev:backend` - Run API only
- `npm run dev:worker` - Run worker only
- `npm run dev:frontend` - Run frontend only
- `npm run lint` - Frontend lint
- `npm run typecheck` - Frontend type check
- `npm run db:seed` - Re-seed database

## Verification Smoke Flow

1. Register a user and login
2. Open a problem page
3. Run code with sample input
4. Submit code and verify the final verdict response
5. Enroll and validate locked hints/editorial access
