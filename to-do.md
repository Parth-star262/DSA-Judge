# DSA Judge - To Do

## Priority 1 - Docker Compose Actually True (Critical for Bullet 4)

### Add Postgres, Redis, worker services
- [x] Add postgres service to docker-compose.yml (with volume + healthcheck)
- [x] Add redis service to docker-compose.yml (with volume + healthcheck)
- [x] Add worker service to docker-compose.yml (same image as backend, command `node src/worker.js`)
- [x] Add `depends_on` with condition: `service_healthy` for worker/backend
- [x] Put everything on a shared network

### Create standalone worker entrypoint
- [x] Create `backend/src/worker.js` that imports `startWorker()` and handles SIGTERM/SIGINT for graceful shutdown

### Update backend to not auto-start worker
- [x] Gate `startWorker()` behind `ENABLE_WORKER === 'true'` or remove it from `backend/src/index.js`; API should only serve HTTP, worker runs in separate process

### Add worker script
- [x] Add `"worker": "node src/worker.js"` to backend/package.json scripts

### Update env templates
- [x] Update `backend/.env.example`: `DATABASE_URL` -> `postgres:5432`, `REDIS_URL` -> `redis://redis:6379`, add `ENABLE_WORKER`
- [x] Create `backend/.env.docker`

### Ensure Dockerfiles are production-ready
- [x] Verify `backend/Dockerfile` has g++ (needed for judge)
- [x] Verify `frontend/Dockerfile`; ensure `next.config.*` has `output: 'standalone'` if using multi-stage builds

---

## Priority 2 - Strengthen The Async Pipeline (Critical for Bullet 1)

### Enable retries/backoff
- [x] Change `attempts: 1` to `attempts: 3` with `backoff: { type: 'exponential', delay: 2000 }` in `backend/src/workers/judgeWorker.js`
- [x] Keep `removeOnComplete`/`removeOnFail` reasonable

### Add submission result caching in Redis
- [x] Add `cacheSubmissionResult(submissionId, result, ttl=300)` to `backend/src/services/redis.js`
- [x] Add `getSubmissionResult(submissionId)` to `backend/src/services/redis.js`

### Write to cache on completion
- [x] After `prisma.submission.update(...)` in `backend/src/services/submissionJudge.js`, write final result to Redis cache

### Read from cache first
- [x] In GET `/:id` in `backend/src/routes/submissions.js`, check Redis cache before hitting DB
- [x] In SSE stream's immediate-return path in `backend/src/routes/submissions.js`, check Redis cache before hitting DB

### Fix README wording
- [x] Remove mention of "synchronous judge service" from `backend/README.md`
- [x] Document BullMQ worker + Redis queue + SSE in `backend/README.md`

---

## Priority 3 - Align Frontend Claims (Easy Fix)

### Correct the mechanism description
- [x] In `frontend/src/app/problems/[slug]/page.tsx`, remove "polling" label from comments OR rename `pollSubmissionResult` to `fallbackPollSubmissionResult` and add comment explaining it's a fallback

### Harden SSE
- [x] Add reconnect logic (max 2 retries with backoff) in `frontend/src/lib/sse.ts` if connection drops before terminal event

### Update resume text
- [x] Change resume/README text to "real-time Server-Sent Events (SSE) streaming"

---

## Priority 4 - Tighten DB/Access Control Claims (Polish)

### (Optional but nice) Add Enrollment model
- [x] Add `Enrollment` model (userId, enrolledAt, optional expiresAt) to `backend/prisma/schema.prisma`
- [x] Keep `User.role` as source of truth OR migrate; if not migrating data, document role-based enrollment in README

### Verify access control is explicit
- [x] Double-check hints/editorial routes enforce enrollment/role in `backend/src/routes/problems.js`
- [x] Ensure consistency and add comments

### Seed demo data
- [x] Create `backend/prisma/seed.js`: ENROLLED users, hints at different levels, locked editorial to prove granular access control

---

## Priority 5 - Evidence & Verification

### Add queue tests
- [x] Create `backend/__tests__/queue.test.js`: test submitting enqueues a job, worker processes it, result written to DB/cache

### CI validation
- [x] Add `docker compose config` to `.github/workflows/ci.yml` (if exists) to catch compose syntax errors

### Document architecture
- [x] Add simple architecture diagram in text (API -> Redis/BullMQ -> Worker -> Judge -> DB) to root `README.md`
