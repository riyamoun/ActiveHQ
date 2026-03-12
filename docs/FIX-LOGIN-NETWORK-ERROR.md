# Fix "Network Error" / CORS / 500 on Login (Demo + Live)

## 1. CORS (must do on Render)

Frontend on Vercel is blocked because the API does not allow its origin. **You must add the frontend URL to the API’s CORS list.**

1. Open **Render** → your **activehq-api** service → **Environment**.
2. Add or edit **CORS_ORIGINS_STR** and set it to your frontend origins, **comma-separated, no spaces**:

   **For your current Vercel URLs, use:**
   ```text
   https://active-hq-git-main-riyamouns-projects.vercel.app,https://active-hq.vercel.app
   ```

   If you use a custom domain (e.g. activehq.fit), add it too:
   ```text
   https://active-hq-git-main-riyamouns-projects.vercel.app,https://active-hq.vercel.app,https://activehq.fit,https://www.activehq.fit
   ```

3. **Save** and wait for the service to **redeploy** (or trigger a deploy).  
   After redeploy, the browser will get `Access-Control-Allow-Origin` and the "blocked by CORS policy" error will go away.

---

## 2. 500 on login (backend error)

If you still see a 500 after CORS is fixed:

- **Run migrations on Render**  
  The API uses a `refresh_tokens` table. If migrations were never run there, login can 500.  
  - In Render → **activehq-api** → **Shell** (or use a one-off job), run:
    ```bash
    cd backend && alembic upgrade head
    ```
  - Or run the same in a **local** terminal with `DATABASE_URL` set to your **Render Postgres** URL.

- **Check Render logs**  
  In Render → **activehq-api** → **Logs**, look at the time of the login request. You’ll see the real error (e.g. missing table, connection error). Fix that (migrations, DB URL, etc.).

Login is now written so that if storing the refresh token fails (e.g. table missing), it still returns tokens and logs a warning instead of returning 500. After you run migrations, refresh token storage will work fully.

---

## 3. Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | Render → activehq-api → Environment | Set **CORS_ORIGINS_STR** = `https://active-hq-git-main-riyamouns-projects.vercel.app,https://active-hq.vercel.app` (and your custom domain if any). |
| 2 | Save & redeploy | Wait for deploy to finish. |
| 3 | Render Shell (or local with Render DB URL) | Run `alembic upgrade head` in the backend so `refresh_tokens` (and other new tables) exist. |
| 4 | Retry login | Use demo credentials or your own; CORS and 500 should be resolved. |

---

---

## 4. Demo login returns 401 (Invalid email or password)

If you use the **Try demo** flow (owner@fitzonegym.com / Owner@123) and get **401**:

- The backend creates the demo account only when the database has **no gyms**. On first deploy, that data may not exist yet.
- **Automatic fix:** The frontend now calls **GET /api/v1/public/seed-demo** when demo login returns 401. That endpoint creates the demo gym + owner once if the DB is empty, then you can retry **Start Demo** (or the page will retry once for you).
- **Manual option:** You can also call once in the browser:  
  `https://activehq-api.onrender.com/api/v1/public/seed-demo`  
  Then log in with owner@fitzonegym.com / Owner@123.

---

**Summary:** CORS = add Vercel (and custom) URLs to **CORS_ORIGINS_STR** on Render and redeploy. 500 = run **alembic upgrade head** against the Render DB. 401 on demo = seed-demo runs automatically on first failed demo login, or call **GET /api/v1/public/seed-demo** once.
