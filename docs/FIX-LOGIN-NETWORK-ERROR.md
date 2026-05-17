# Fix "Network Error" / CORS / 500 on Login (Demo + Live)

## 1. CORS (must do on Render)

The browser blocks API calls when the response has no `Access-Control-Allow-Origin`. That often happens when:

- **CORS env is wrong or missing** on Render, or
- **The API is cold-starting** (free tier sleeps after ~15 min idle) and the first response is a gateway error **without** CORS headers — the console may still say "CORS" even though the root cause is sleep/502.

### Fix on Render

1. Open **Render** → **activehq-api** → **Environment**.
2. Set **both** variables exactly:

```env
CORS_ORIGINS_STR=https://www.activehq.fit,https://activehq.fit,https://active-hq.vercel.app,https://active-gcylu4czt-riyamouns-projects.vercel.app
CORS_ALLOW_ORIGIN_REGEX=^https://((.*\.vercel\.app)|(www\.)?activehq\.fit)$
```

3. **Save Changes** → **Manual Deploy** → **Deploy latest commit**.  
   Env changes do not apply until the service restarts.

4. Verify API is up:

```text
https://activehq-api.onrender.com/health
```

5. Retry register/login from `https://www.activehq.fit/register`.

### Free-tier cold start

Render free web services spin down after ~15 minutes without traffic. The next request can take ~1 minute and may fail once. For gym onboarding, use a **paid Starter** web service, or temporarily ping `/health` every 5–10 minutes (workaround only).

---

## 2. Vercel: refresh gives 404 on `/register`, `/login`, `/dashboard`

That is a **SPA routing** issue, not Render. Ensure `frontend/vercel.json` exists:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Commit, push, and redeploy Vercel. Confirm the Vercel project **Root Directory** is `frontend` if you deploy from the monorepo.

---

## 3. 500 on login (backend error)

If you still see a 500 after CORS is fixed:

- **Run migrations on Render**  
  The API uses a `refresh_tokens` table. If migrations were never run there, login can 500.  
  - In Render → **activehq-api** → **Shell**, run:
    ```bash
    alembic upgrade head
    ```
  - Or run locally with `DATABASE_URL` set to your **Render Postgres** URL.

- **Check Render logs**  
  Render → **activehq-api** → **Logs** at the time of the login request.

---

## 4. Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | Render → Environment | Set `CORS_ORIGINS_STR` + `CORS_ALLOW_ORIGIN_REGEX` (see above). |
| 2 | Render | Manual deploy after saving env. |
| 3 | Browser | Open `/health`, then retry register from `www.activehq.fit`. |
| 4 | Vercel | `frontend/vercel.json` rewrites deployed; root dir = `frontend`. |
| 5 | Render Shell | `alembic upgrade head` if login 500s. |
| 6 | Before onboarding | Upgrade API to paid Starter if possible (no sleep). |

---

## 5. Demo login returns 401 (Invalid email or password)

If you use the **Try demo** flow (owner@fitzonegym.com / Owner@123) and get **401**:

- Demo data must exist in the **same database** the deployed API uses (Render Postgres), not only your local DB.
- Run seed/setup against production DB, or register a real gym owner on production.
