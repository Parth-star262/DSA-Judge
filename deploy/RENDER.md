Render deployment steps
======================

Follow these steps to deploy the backend and worker on Render using your GitHub repository.

1. Connect Render to GitHub
   - In Render dashboard, go to "New" → "Web Service" and choose "Connect a repository".
   - Select the `Parth-star262/DSA-Judge` repo and `main` branch.

2. Create the backend Web Service
   - Root directory: `backend`
   - Environment: `Node`
   - Build Command: `npm ci && npx prisma generate`
   - Start Command: `npm start`
   - Port: leave default or set `PORT=5001` as an env var
   - Add these environment variables in Render (set actual secret values):
     - `DATABASE_URL` (Postgres connection string)
     - `REDIS_URL` (Redis connection string)
     - `JWT_SECRET`
     - `JUDGE0_URL` and `JUDGE0_API_KEY` (if using Judge0)
     - `GEMINI_API_KEY`, `GROQ_API_KEY` (optional)

3. Create a Background Worker for the submission processor
   - New → Background Worker
   - Root directory: `backend`
   - Build Command: `npm ci && npx prisma generate`
   - Start Command: `npm run worker` (or whatever script runs your worker)
   - Add the same env vars as the web service (except `PORT`)

4. Add a release / deploy hook to run migrations on deploy
   - In the Service settings, add a "Deploy hook" / "Start command on deploy":
     - `npx prisma migrate deploy && node prisma/seed.js`
   - Alternatively, run migrations manually once after the service is created.

5. Review logs and verify
   - Check Render build & deploy logs for errors.
   - Verify API health: `https://<your-render-service>.onrender.com/health`

Notes
-----
- Do NOT store secrets in the repo; always set them via Render's Environment panel.
- If you prefer IaC, you can create a `render.yaml` and import that when connecting the repo.
