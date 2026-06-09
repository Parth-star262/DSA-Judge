Vercel deployment steps
======================

Steps to deploy the `frontend` on Vercel:

1. Import project
   - In Vercel dashboard, choose "Import Project" and connect your GitHub account.
   - Select `Parth-star262/DSA-Judge` and set Root Directory to `frontend`.

2. Build & Output
   - Framework: Next.js (should be detected automatically).
   - Build Command: `npm ci && npm run build`
   - Output Directory: (leave default for Next.js)

3. Environment variables
   - Add `NEXT_PUBLIC_API_URL` with value `https://<your-render-backend>.onrender.com/api`
   - Add any other runtime envs needed by the frontend.

4. Deploy and verify
   - Deploy the project and check the deployment URL.
   - Ensure the frontend can reach the backend API URL you configured.

Notes
-----
- If you need a custom domain, add it in Vercel's Domains section and follow the DNS steps.
