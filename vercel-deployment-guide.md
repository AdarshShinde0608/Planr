# Vercel Deployment Guide

This guide walks through deploying Planr as two separate Vercel projects — the Express backend as a Serverless Node.js function, and the Next.js frontend as a static/SSR app.

---

## Prerequisites

Before starting, ensure you have:

1. A [Vercel account](https://vercel.com/signup) (free tier works).
2. Your code pushed to a **GitHub**, **GitLab**, or **Bitbucket** repository.
3. A hosted **MongoDB database** — [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) (free tier available).
4. Your API keys ready:
   - `JWT_SECRET` — a random string (generate with `openssl rand -base64 32`)
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
   - (Optional) `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

---

## Step 1: Set Up MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free **M0 cluster**.
2. Under **Database Access**, create a database user with a username and password.
3. Under **Network Access**, add `0.0.0.0/0` to allow connections from Vercel's dynamic IPs.
4. Click **Connect → Drivers** and copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/planr?retryWrites=true&w=majority
   ```
   Replace `<user>` and `<password>` with the database user credentials you created.

---

## Step 2: Deploy the Backend (`server/`)

The Express server is configured in `server/vercel.json` to run as a Vercel Serverless Function.

### 2a. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **"Import Git Repository"** and select your repo.
3. When prompted for the **Root Directory**, set it to `server`.
4. Leave the **Framework Preset** as **Other**.
5. Click **Deploy** once — it will likely fail because environment variables are missing. That's expected.

### 2b. Add Environment Variables

1. In your Vercel project dashboard, go to **Settings → Environment Variables**.
2. Add the following variables:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret string |
| `GEMINI_API_KEY` | Your Gemini API key |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GOOGLE_CLIENT_ID` | (Optional) Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | (Optional) Your Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://<your-backend-domain>/api/calendar/auth/callback` |

3. After saving, go to **Deployments** and click **Redeploy** on the latest deployment.

### 2c. Note Your Backend URL

Once deployed successfully, note the URL. It will look like:
```
https://planr-server-xxxx.vercel.app
```

---

## Step 3: Deploy the Frontend (`client/`)

### 3a. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) again.
2. Import the **same repository**.
3. When prompted for the **Root Directory**, set it to `client`.
4. The **Framework Preset** should be auto-detected as **Next.js**.
5. Before deploying, expand **Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend-domain>/api` (from Step 2c) |

6. Click **Deploy**.

### 3b. Update Backend CORS (Important)

Once the frontend is deployed, you'll have a frontend URL like:
```
https://planr-xxxx.vercel.app
```

Update the backend's CORS config in `server/src/app.js` to restrict to your frontend domain:

```js
app.use(cors({
  origin: 'https://planr-xxxx.vercel.app', // replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then redeploy the backend.

---

## Step 4: Update Google OAuth Redirect URI (Optional)

If you are using Google Calendar integration:

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Navigate to **APIs & Services → Credentials**.
3. Edit your OAuth 2.0 client and add the Vercel backend URL to **Authorized redirect URIs**:
   ```
   https://<your-backend-domain>/api/calendar/auth/callback
   ```
4. Update the `GOOGLE_REDIRECT_URI` environment variable in Vercel to match.

---

## Local Development

Nothing changes locally. Run the app as usual:

```bash
# From the project root:
npm run dev-server   # starts Express on port 5000
npm run dev-client   # starts Next.js on port 3000
```

The conditional `require.main === module` check in `server/src/app.js` ensures `app.listen()` still fires normally in local development.
