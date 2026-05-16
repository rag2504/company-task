# Quickbill POS — AI Platform Setup

## Prereqs

- Node.js 18+
- MongoDB Atlas or local MongoDB
- [Groq API key](https://console.groq.com/)

## Backend (`backend/`)

1. Copy environment template:

   ```bash
   cp env.example .env
   ```

2. Edit `.env`:

   - `MONGODB_URI` — your Mongo connection string (required).
   - `JWT_SECRET` — long random string (required for production).
   - `GROQ_API_KEY` — Groq secret (required for AI features).
   - `GROQ_MODEL` — optional, default `llama-3.3-70b-versatile`.
   - `FRONTEND_ORIGINS` — comma-separated URLs (e.g. `http://localhost:3000`).

3. Install and run:

   ```bash
   npm install
   npm run seed    # optional demo data (demo@quickbill.app / demo12345)
   npm run dev
   ```

API listens on `PORT` (default `5000`). Socket.IO shares the same origin for real-time notifications.

## Frontend (`f/`)

The repo includes **`f/.env.development`** with `REACT_APP_API_URL=http://localhost:5000`. After editing env vars, **restart** `npm start`.

1. Install and start:

   ```bash
   npm install
   npm start
   ```

2. Sign in:

   - After `npm run seed`, use **demo@quickbill.app** / **demo12345**, or
   - Register a new **Owner** via Sign Up (stored in MongoDB).

You can override the API URL with your own `f/.env.development` or `f/.env.local`. There is also a **`proxy`** entry in `f/package.json` pointing at port 5000 as a fallback for `/api` requests.

## Offline / legacy mode

If the backend is **unreachable**, sign-in falls back to the original local-only accounts (`owner@provisionstore.com` / `admin123`). AI features need the API + JWT.

## AI shows 404 or “Request failed with status code 404”

The React app was calling `/api/...` on port **3000** instead of your Express server.

**Fix:** Use `f/.env.development` (already in the repo) **or** the `proxy` in `f/package.json`, then **stop and restart** `npm start`.

Also ensure **`npm run dev`** (or `npm start`) is running in `backend/` on port **5000**.

## AI Chat returns 401

You signed in with **offline / localStorage** mode (no JWT). Sign **out**, start the API, and sign in again — login now tries the API first and stores a token automatically.

## Groq errors / empty AI text

Set **`GROQ_API_KEY`** in `backend/.env` and restart the backend.

## Deploy (Vercel + Render)

### Vercel (frontend in `f/`)

1. Import the GitHub repo on [Vercel](https://vercel.com).
2. Set **Root Directory** to `f`.
3. Leave **Build Command**, **Install Command**, and **Output Directory** on **defaults** (do not use `cd f && …` — you are already inside `f`).
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `build`
4. Environment variable:
   - `REACT_APP_API_URL` = your Render URL, e.g. `https://company-task-5vh3.onrender.com` (no trailing slash).

If **Root Directory** is empty (repo root), the root `vercel.json` uses `npm install --prefix f` instead.

### Render (backend in `backend/`)

1. New **Web Service** → connect the same repo.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start` (not `npm run dev` — dev binds to localhost only).
5. **Environment** (required):

   | Key | Example |
   |-----|---------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Atlas connection string |
   | `JWT_SECRET` | long random string |
   | `GROQ_API_KEY` | Groq key (for AI) |
   | `FRONTEND_ORIGINS` | `https://your-app.vercel.app` (comma-separated if multiple) |

   Do **not** set `HOST=127.0.0.1` or a fixed `PORT` on Render — the platform sets `PORT`; the app binds `0.0.0.0` automatically.

6. After deploy, open `https://YOUR-RENDER-URL/api/health` — should return `{"ok":true,...}`.

Push these config changes to GitHub, then redeploy both services.

## Security notes

- Never commit real `.env` secrets (Mongo passwords, production JWT, Groq keys).
- Use `backend/env.example` as a template only.
