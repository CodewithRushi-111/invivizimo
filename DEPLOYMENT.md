# Invoizmo Deployment Guide

This guide outlines the best platforms and step-by-step configurations for deploying the **Invoizmo** full-stack application (Vite React Frontend + Node.js/Express Backend + MongoDB Database).

---

## 🚀 The Best Deployment Strategies

Here are the three best paths to deploy your application, ranked from easiest to most robust:

| Strategy | Frontend | Backend | Database | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Railway (Highly Recommended)** | Railway | Railway | MongoDB Atlas | **Easiest setup, fast deployment, unified dashboard.** |
| **Option 2: Vercel + Render (Best Free Tier)** | Vercel | Render | MongoDB Atlas | **Free hosting, optimal frontend performance (Vercel CDN).** |
| **Option 3: DigitalOcean / VPS** | Nginx on VM | Node.js on VM | Managed MongoDB or self-hosted | **Production scaling, absolute control over servers.** |

---

## 🛠️ Step-by-Step Deployment Instructions

### 1. Database Setup: MongoDB Atlas (Free Tier)
Regardless of where you host the code, you need a cloud-hosted MongoDB instance.
1. Sign up/Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Free Shared Cluster**.
3. Under **Database Access**, create a database user with a secure password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) to let cloud servers connect.
5. Go to **Clusters** > **Connect** > **Drivers** to get your connection string:
   ```env
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/invivizimo_db?retryWrites=true&w=majority
   ```

---

### Option 1: Unified Deployment on Railway (Recommended)

Railway is extremely easy to use, supports automatic builds from GitHub, and allows environment variable injection seamlessly.

#### Step 1: Deploy the Backend
1. Sign up on [Railway.app](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo** > Select your repository.
3. Once imported, go to **Settings** > set **Root Directory** to `backend`.
4. In the **Variables** tab, add the following backend environment variables:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://... (Your MongoDB Atlas connection string)
   JWT_ACCESS_SECRET=your_super_secret_jwt_access_key
   JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CLIENT_URL=https://your-frontend-url.railway.app
   CORS_ORIGINS=https://your-frontend-url.railway.app
   ENCRYPTION_KEY=a29ffcb08bcde6f481c4e7ab291bfceef24ef78ac12ee74bcf1b2e2d9b23fa7c
   ```
5. Railway will automatically build and expose the backend. Copy its public URL (e.g., `https://your-backend-url.railway.app`).

#### Step 2: Deploy the Frontend
1. In the same project, click **New** > **GitHub Repo** > Select your repository again.
2. Go to **Settings** > set **Root Directory** to `frontend`.
3. In the **Variables** tab, add the frontend environment variable:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   ```
4. Railway will build your Vite React app and give you a public URL. Update the backend's `CLIENT_URL` and `CORS_ORIGINS` variables with this URL.

---

### Option 2: Vercel (Frontend) + Render (Backend) (Best Free Tier)

Vercel has the best global CDN for React SPAs, while Render offers free web services for Express APIs.

#### Step 1: Deploy Frontend on Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** > Import your GitHub repo.
3. Configure the Project:
   * **Framework Preset:** Vite
   * **Root Directory:** `frontend`
   * **Build & Development Settings:** Default
4. In the **Environment Variables** section, add:
   * `VITE_API_BASE_URL` = `https://invoizmo-backend.onrender.com` (your backend's public URL)
5. Click **Deploy**. Copy your deployment URL (e.g., `https://invoizmo.vercel.app`).

#### Step 2: Deploy Backend on Render
1. Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
   * **Root Directory:** `backend`
   * **Runtime:** Node
   * **Build Command:** `npm install && npm run build` (or similar)
   * **Start Command:** `node dist/server.js` (since it is compiled TypeScript)
   * **Instance Type:** Free (or Starter if you want to avoid cold starts)
5. Add the **Environment Variables** in the configuration page (same variables as listed in the Railway section above). Make sure `CLIENT_URL` and `CORS_ORIGINS` point to your Vercel URL.
6. Deploy!

> [!NOTE]
> Render's **Free Tier** puts services to sleep after 15 minutes of inactivity. When a new request arrives, it can take 30–50 seconds to spin up ("cold start"). To avoid this, upgrade to their starter tier ($7/month) or use Railway.

---

## 🔒 Post-Deployment Security Checklist

Before sharing your production URL:
1. **Rotate JWT Secrets**: Do not use local development keys in production. Generate random 64-character hex strings for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY`.
2. **CORS Hardening**: Ensure `CORS_ORIGINS` does not contain `*` or localhost addresses in production. Only allow your exact frontend production domain.
3. **Database Security**: Ensure your MongoDB Atlas credentials are not committed to Git. Only inject them via the platform's Environment Variables tab.
