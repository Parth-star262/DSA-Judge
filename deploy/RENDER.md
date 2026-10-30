Render deployment steps
=======================

The production architecture uses one web service and one background worker.
Submissions are queued in Redis, processed by BullMQ, persisted in PostgreSQL,
and streamed back to clients with real-time Server-Sent Events (SSE).

1. Connect Render to GitHub
   - Create or sync the Blueprint from `render.yaml`.
   - Use repository `Parth-star262/DSA-Judge` and branch `main`.

2. Configure `dsa-judge-backend`
   - Root directory: `backend`
   - Environment: `Node`
   - Build command:
     `npm ci && npx prisma generate && npx prisma db push && node prisma/seed.js`
   - Start command: `npm start`

3. Configure `dsa-judge-worker`
   - Type: Background Worker
   - Root directory: `backend`
   - Build command: `npm ci && npx prisma generate`
   - Start command: `npm run worker`

4. Configure environment variables on both services
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `JUDGE0_URL` and `JUDGE0_API_KEY` when using hosted Judge0
   - Optional AI provider keys

5. Verify
   - Check the deploy logs for build and startup errors.
   - Open `https://<your-render-service>.onrender.com/health`.
   - Submit a solution and confirm the POST request returns a submission ID,
     followed by the final verdict through SSE.
