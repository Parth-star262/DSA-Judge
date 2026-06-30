Render deployment steps
=======================

The free-tier architecture uses one web service. Submissions are judged
synchronously by the backend request; no background worker is required.

1. Connect Render to GitHub
   - Create or sync the Blueprint from `render.yaml`.
   - Use repository `Parth-star262/DSA-Judge` and branch `main`.

2. Configure `dsa-judge-backend`
   - Root directory: `backend`
   - Environment: `Node`
   - Build command:
     `npm ci && npx prisma generate && npx prisma db push && node prisma/seed.js`
   - Start command: `npm start`

3. Configure environment variables
   - `DATABASE_URL`
   - `REDIS_URL` (optional cache; not required for submission execution)
   - `JWT_SECRET`
   - `JUDGE0_URL` and `JUDGE0_API_KEY` when using hosted Judge0
   - Optional AI provider keys

4. Verify
   - Check the deploy logs for build and startup errors.
   - Open `https://<your-render-service>.onrender.com/health`.
   - Submit a solution and confirm the POST request returns the final verdict.

Do not create a Render Background Worker for submissions. BullMQ is not part
of the free-tier submission path.
