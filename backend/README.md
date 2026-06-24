# Secure Express 5 + TypeScript + MongoDB Backend Boilerplate

This folder contains a production-ready, secure, and modern backend for **Invivizimo** designed using **Express 5**, **TypeScript**, **Mongoose**, and **Zod**.

## Features

- **Runtime & Language:** Node.js (Active LTS) with TypeScript (Strict mode enabled).
- **Validation:** Request inputs (`body`, `query`, `params`) validated with **Zod** schema middleware.
- **Environment Safety:** Environment variables are validated on startup using Zod. The application crashes instantly with friendly messages if misconfigured.
- **Authentication:** 
  - JWT access tokens (15-minute expiry) in JSON response bodies.
  - HttpOnly, Secure, SameSite=Strict refresh tokens (7-day expiry) inside cookies.
  - Refresh token rotation (RTR) with bcrypt-hashed stored refresh tokens.
  - Breach detection: If a reused or old refresh token is submitted, all active sessions for that user are immediately revoked.
  - Custom error codes (`TOKEN_EXPIRED`, `UNAUTHORIZED`, `TOKEN_INVALID`) mapped for optimal frontend response handling.
- **Security Protections:**
  - `helmet` to set secure HTTP headers.
  - Explicit `CORS` origin allowlist (no wildcards).
  - Global API rate limiter (100 reqs/min).
  - Strict Auth route rate limiter (10 failed reqs/min).
  - Body payload size limit (`10kb`) to mitigate Denial of Service (DoS) attacks.
  - Timing-safe token comparisons to defend against timing side-channel attacks.
- **Auditing & Logging:**
  - Structured console logs with **Winston** (redacts passwords, secrets, and raw PII).
  - Root `.cursorignore` and backend `.gitignore` pre-configured.
- **Infrastructure:**
  - `GET /health` cheap liveness endpoint.
  - `GET /ready` checking MongoDB state (returns `503` if database is down).
  - Graceful shutdown handles `SIGINT`/`SIGTERM` closing DB connections cleanly.

---

## Setup Instructions

### 1. Prerequisites
- **Node.js** (LTS version 20+ recommended)
- **MongoDB** instance running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI connection string.

### 2. Install Dependencies
Navigate to the `backend` directory and run:
```bash
npm install
```

### 3. Environment Variables Configuration
A `.env` file has been pre-configured with randomly generated secure secrets for local testing. If you need to reconfigure it, copy the `.env.example` file and fill in your details:
```bash
cp .env.example .env
```

### 4. Running the Server

#### Development Mode (with hot-reloading via `tsx`):
```bash
npm run dev
```

#### Production Build & Run:
```bash
# Compile TypeScript to JavaScript
npm run build

# Start the compiled server
npm start
```

---

## Testing the API
A Postman collection is committed in `postman/collection.json` along with its environment schema template `postman/environment.json`.

1. **Import** both files into Postman.
2. Select the `Invivizimo Local` environment.
3. Run the requests in sequence:
   - **POST** `/api/v1/auth/register` (registers a new user)
   - **POST** `/api/v1/auth/login` (logs in, saves the access token, and sets the secure HttpOnly refresh token cookie)
   - **GET** `/api/v1/users/me` (reads profile info)
   - **PATCH** `/api/v1/users/me` (updates profile info)
   - **GET** `/api/v1/users/me/export` (downloads GDPR data)
   - **POST** `/api/v1/auth/refresh` (refreshes expired access tokens automatically)
   - **POST** `/api/v1/auth/logout` (logs out and clears cookies)
   - **DELETE** `/api/v1/users/me` (deletes user account by providing confirmation text `"DELETE MY ACCOUNT"`)
