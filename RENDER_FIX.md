# Render — fix “No open ports on 0.0.0.0”

This is **not** a proxy issue. The API must listen on `0.0.0.0` using Render’s `PORT`.

## 1. Render dashboard (required)

Open your **Web Service** → **Settings**:

| Field | Correct value |
|-------|----------------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

**Wrong:** `npm run dev` (uses nodemon + localhost — Render cannot route traffic).

## 2. Environment variables

**Delete** these if you added them from `env.example`:

- `HOST`
- `PORT`

**Keep / add:**

| Key | Example |
|-----|---------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI |
| `JWT_SECRET` | long random string |
| `GROQ_API_KEY` | (for AI) |
| `FRONTEND_ORIGINS` | `https://your-site.netlify.app` |

Render injects `PORT` automatically. Do not set it yourself.

## 3. Push code and redeploy

```bash
git add .
git commit -m "Fix Render host/port binding"
git push
```

Then **Manual Deploy** → **Clear build cache & deploy**.

## 4. Success log

You should see something like:

```text
Quickbill API ready (production) — http://localhost:10000  [bind 0.0.0.0:10000]
```

(`10000` is an example — Render chooses the port.)

Test: `https://YOUR-SERVICE.onrender.com/api/health`

## 5. Netlify (frontend)

No proxy on Render. Set on **Netlify**:

- `REACT_APP_API_URL` = `https://YOUR-SERVICE.onrender.com`

No trailing slash.
