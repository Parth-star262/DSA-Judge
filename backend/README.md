# DSA Judge Backend

The backend is split into two runtime processes:

- `npm start` starts the HTTP API only.
- `npm run worker` starts the BullMQ judge worker.

Submissions are persisted as `PENDING`, placed on the Redis-backed BullMQ queue, processed by the worker, and updated in PostgreSQL. Completed results are cached in Redis for five minutes and delivered to clients through Server-Sent Events (SSE). The API exposes a bounded database polling fallback for clients that cannot maintain an SSE connection.

The standalone worker is required in production. Set `ENABLE_WORKER=true` only for local compatibility when intentionally running the worker in the API process; Docker Compose uses a dedicated worker service.
