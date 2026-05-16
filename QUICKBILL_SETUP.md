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

## Security notes

- Never commit real `.env` secrets (Mongo passwords, production JWT, Groq keys).
- Use `backend/env.example` as a template only.
