# Deploying the backend and web app

Both are free to host. The database (Aiven) and mobile app (Expo Go) are
unaffected by any of this.

## 1. Backend -> Render

1. Go to render.com, sign in with GitHub (no card required for the free tier).
2. "New +" -> "Blueprint", select this repo/branch. Render reads `render.yaml`
   at the repo root and asks you to fill in these values (your real Aiven
   credentials and secrets -- never commit these to git):
   - `dbname`, `dbhost`, `dbport`, `dbuser`, `dbpassword` (from Aiven)
   - `jwt_secret_key` (any long random string)
   - `GEMINI_API_KEY`
   - `CORS_EXTRA_ORIGINS` -- leave blank for now, come back and set it once
     you have the Vercel URL from step 2 (e.g.
     `https://vitalpilot.vercel.app`)
3. Deploy. You'll get a URL like `https://vitalpilot-backend.onrender.com`.
4. Visit `<that URL>/health` in a browser -- it should return
   `{"status": "ok", "database": "ok"}`. If `database` says `down`, double
   check the Aiven env vars.

## 2. Web app -> Vercel

1. Go to vercel.com, sign in with GitHub.
2. "Add New..." -> "Project", import this repo.
3. This is a monorepo, so set **Root Directory** to
   `vitalpilot/frontend/web` in the project's settings (Vercel usually
   detects Next.js automatically once that's set).
4. Add an environment variable: `NEXT_PUBLIC_API_BASE_URL` = the Render URL
   from step 1 (no trailing slash).
5. Deploy. You'll get a URL like `https://vitalpilot.vercel.app`.
6. Go back to Render and set `CORS_EXTRA_ORIGINS` to that Vercel URL, then
   redeploy the backend (Render does this automatically on env var changes).

## 3. Keep both awake (free tiers auto-sleep from inactivity)

1. On GitHub: Settings -> Secrets and variables -> Actions -> **Variables**
   tab -> "New repository variable".
2. Name: `BACKEND_HEALTH_URL`. Value: the Render URL + `/health`, e.g.
   `https://vitalpilot-backend.onrender.com/health`.
3. That's it -- `.github/workflows/keep-alive.yml` already exists and pings
   it every 6 hours automatically, which keeps both Render and the Aiven
   database from auto-pausing. You can also trigger it manually from the
   Actions tab ("Run workflow") to test it right away.

## 4. Point the mobile app at the hosted backend

In `vitalpilot/frontend/mobile/.env` (create it from `.env.example` if it
doesn't exist), set:

```
EXPO_PUBLIC_API_BASE_URL=https://vitalpilot-backend.onrender.com
```

Restart `expo start` after changing this.
