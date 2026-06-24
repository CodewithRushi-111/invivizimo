# Invivizimo Backend Handoff & API Documentation

This document outlines the architecture, environment variables, authentication life cycle, security configurations, database schemas, and all error/success response scenarios for the Invivizimo backend.

---

## 1. Project Overview & Quickstart

The backend is built with **Node.js, Express, TypeScript, and Mongoose (MongoDB Atlas)**. It implements strict schema validation on startup, JWT-based access/refresh token rotation, and a custom CLI database utility.

### Running the App (under 5 minutes)
1. **Navigate to the Backend Directory:**
   ```bash
   cd backend
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Verify Environment Variables:**
   Confirm that `.env` contains:
   - `PORT`: Local server port (default `5000`)
   - `MONGODB_URI`: Standard replica set MongoDB connection URI
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Secure 32+ character keys
   - `ENCRYPTION_KEY`: A 64-character hex key (for storing encrypted data)
   - `CLIENT_URL` & `CORS_ORIGINS`: Allowed client URL (e.g. `http://localhost:5173`)
4. **Start in Development Mode:**
   ```bash
   npm run dev
   ```
   *Note:* The dev script runs hot reloading via `tsx watch src/server.ts`. It will fail-fast and crash immediately if any env variable is missing or invalid.

---

## 2. Repository & Architectural Structure

The backend follows a modular domain structure to keep resources isolated and easily extensible:

```text
backend/
├── src/
│   ├── server.ts             # Application entrypoint (Mongoose connection & server listener)
│   ├── app.ts                # Express application configuration (middleware & module routing)
│   ├── config/
│   │   ├── env.ts            # Zod schema validation for process.env (crashes on bad configuration)
│   │   └── db.ts             # DB connection logic and graceful shutdown handler
│   ├── middleware/
│   │   ├── requireAuth.ts    # Access JWT validation middleware (extracts user and appends to req.user)
│   │   ├── roleGuard.ts      # Checks if user role has authorization for an endpoint
│   │   ├── validate.ts       # Utility wrapper to validate request schema via Zod
│   │   └── errorHandler.ts   # Global Express error handler (translates errors to custom JSON responses)
│   ├── modules/
│   │   ├── auth/             # Authentication endpoint controller, routing, and services
│   │   └── users/            # Profile management, GDPR export, and account deletion
│   ├── scripts/
│   │   └── db-tool.ts        # Database CLI script to manage users via command line
│   ├── utils/
│   │   ├── cookie.ts         # Manual cookie parsing utility for SameSite & HttpOnly refresh token cookies
│   │   ├── logger.ts         # Winston logger configuration with built-in PII redaction logic
│   │   └── ownershipCheck.ts # Utility to verify that a resource belongs to the requesting user
│   └── types/
│       └── express.d.ts      # Express Request type override to support req.user
├── postman/
│   ├── collection.json       # Exported Postman collection containing all endpoint templates
│   └── environment.json      # Exported environment configuration with local variables
├── package.json              # Dependencies and execution scripts
└── tsconfig.json             # TypeScript rules (Strict mode enabled)
```

---

## 3. Database Schema: User Model

The main data schema is the **User Schema** defined in `src/modules/users/user.model.ts`:

- **`email`** (String, Unique, Required, Lowercase): The identifier for the user.
- **`password`** (String, Required): Hashed password using `bcryptjs`.
- **`role`** (String, Enum: `['user', 'admin']`, Default: `'user'`): Authorization tier.
- **`refreshTokens`** (Array of hashed strings): Stores historically valid refresh tokens for breach detection.
- **`failedLoginAttempts`** (Number, Default `0`): Tracks authentication failures.
- **`lockUntil`** (Date, Optional): Expiration timestamp for temporary account lockouts.

### Security Hooks
- **Pre-save Password Hashing:** Uses Mongoose async pre-save hooks to hash the plain-text password using a work factor of 10 (`bcrypt.genSalt(10)`) whenever the password field is modified.

---

## 4. JWT & Session Life Cycle

The backend utilizes an **Access/Refresh Token** pattern to maintain stateless sessions while securing endpoints.

### Lifetime Standard
- **Access JWT:** Valid for `15 minutes`. Sent via the HTTP header `Authorization: Bearer <token>`.
- **Refresh JWT:** Valid for `7 days`. Stored in a secure, `HttpOnly`, `SameSite=Strict`, `Secure` cookie.

### Refresh Token Rotation (RTR)
To prevent unauthorized users from hijacking permanent sessions, every request to `/api/v1/auth/refresh` performs rotation:
1. The server receives the refresh cookie.
2. The server verifies the signature and retrieves the associated user from the DB.
3. The server invalidates the received refresh token by hashing it and checking it against the user's historical database array.
4. The server generates a **brand new Access Token** and a **brand new Refresh Token**.
5. The new Refresh Token is sent back in a new cookie, and the database is updated.

### Breach Detection
If the server receives a refresh token that has *already* been used (present in the user's `refreshTokens` array):
- It indicates that a token theft has occurred (either the client or the attacker is attempting to reuse an invalidated session token).
- **Security Action:** The server instantly revokes **all** active sessions for that user by wiping the user's `refreshTokens` list, forcing both the legitimate user and the attacker to re-authenticate.

---

## 5. Security & Rate Limiting

The application is hardened against common vectors using:
- **Helmet.js:** Configures secure HTTP headers to block Clickjacking, MIME-sniffing, and basic XSS.
- **CORS:** Restricts requests strictly to white-listed origins configured in `CORS_ORIGINS`. Wildcards are disallowed.
- **Payload Limit:** Restricts JSON payloads to **`10kb`** globally to prevent Denial of Service (DoS) attempts via large uploads.
- **Rate Limiters:**
  - *Global Limiter:* 100 requests per minute per IP.
  - *Auth Limiter:* 10 failed login/register attempts per minute per IP (protects endpoints from brute force).

---

## 6. API Endpoint Specifications

All response payloads contain a uniform structure:
- **Success:** `{"success": true, "data": { ... }}`
- **Failure:** `{"success": false, "error": { "code": "CODE", "message": "Details" }}`

---

### 6.1 Authentication Endpoints (`/api/v1/auth`)

#### 1. POST /register
Registers a new account.
- **Body Requirement:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **Scenario - Approve (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6a3adcefea59f2ad99aa0479",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2026-06-24T02:10:00Z"
    }
  }
  ```
- **Scenario - Duplicate Email (409 Conflict):**
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "User with this email already exists"
    }
  }
  ```

#### 2. POST /login
Authenticates a user and issues session tokens.
- **Body Requirement:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **Scenario - Success (200 OK):**
  - *Header:* Sets cookie `refreshToken` (`HttpOnly; Secure; SameSite=Strict`)
  - *Body:*
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "_id": "6a3adcefea59f2ad99aa0479",
          "email": "user@example.com",
          "role": "user"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c..."
      }
    }
    ```
- **Scenario - Invalid Credentials (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid email or password"
    }
  }
  ```
- **Scenario - Account Locked (423 Locked):**
  Occurs after 5 consecutive failed attempts.
  ```json
  {
    "success": false,
    "error": {
      "code": "LOCKED",
      "message": "Account is temporarily locked. Try again in 15 minutes."
    }
  }
  ```

#### 3. POST /refresh
Rotates the session refresh token. Requires the `refreshToken` cookie.
- **Scenario - Success (200 OK):**
  - *Header:* Sets new cookie `refreshToken`
  - *Body:*
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c..."
      }
    }
    ```
- **Scenario - Expired / Invalid Cookie (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid refresh token"
    }
  }
  ```
- **Scenario - Breach Detected (401 Unauthorized):**
  Occurs when an already-used refresh token is re-submitted.
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Security warning: Reuse of refresh token detected. All sessions revoked."
    }
  }
  ```

#### 4. POST /logout
Invalidates the current session.
- **Scenario - Success (200 OK):**
  - *Header:* Clears cookie `refreshToken`
  - *Body:*
    ```json
    {
      "success": true,
      "data": null
    }
    ```

#### 5. POST /verify-email
Verifies user account via token received by email.
- **Body Requirement:**
  ```json
  {
    "token": "verificationTokenReceivedInConsole"
  }
  ```
- **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Email verified successfully",
      "user": {
        "_id": "6a3adcefea59f2ad99aa0479",
        "email": "user@example.com",
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```
- **Scenario - Invalid/Expired Token (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Invalid or expired verification token"
    }
  }
  ```

#### 6. POST /forgot-password
Initiates password reset sequence by producing a token and reset URL (logged to console).
- **Body Requirement:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Scenario - Success (200 OK):**
  *Note:* Always returns success to prevent user validation scans and address email enumeration security issues.
  ```json
  {
    "success": true,
    "data": {
      "message": "If the email matches an active account, a password reset link has been generated and sent."
    }
  }
  ```

#### 7. POST /reset-password
Resets user password using the token sent in the reset link.
- **Body Requirement:**
  ```json
  {
    "token": "resetPasswordTokenReceivedInConsole",
    "password": "newSecurePassword123"
  }
  ```
- **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Password has been reset successfully. All active sessions have been revoked."
    }
  }
  ```
- **Scenario - Invalid/Expired Token (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Invalid or expired password reset token"
    }
  }
  ```

---

### 6.2 User Management Endpoints (`/api/v1/users`)

All user endpoints require an Authorization Header: `Authorization: Bearer <accessToken>`

#### 1. GET /me
Retrieves the logged-in user's profile.
- **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6a3adcefea59f2ad99aa0479",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2026-06-24T02:10:00Z"
    }
  }
  ```
- **Scenario - Access Token Expired (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "jwt expired"
    }
  }
  ```

#### 2. PUT /me
Updates user details.
- **Body Requirement:**
  ```json
  {
    "email": "updatedemail@example.com"
  }
  ```
- **Scenario - Change Approved (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6a3adcefea59f2ad99aa0479",
      "email": "updatedemail@example.com",
      "role": "user"
    }
  }
  ```

#### 3. GET /me/export (GDPR Export)
Downloads all personal PII stored in the database.
- **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "6a3adcefea59f2ad99aa0479",
        "email": "user@example.com",
        "role": "user",
        "createdAt": "2026-06-24T02:10:00Z"
      },
      "activeSessionsCount": 1
    }
  }
  ```

#### 4. DELETE /me (GDPR Discard)
Permanently deletes the account from the database.
- **Body Requirement:**
  Requires the user to provide their current password and type a confirmation string exactly to verify they intend to delete the account.
  ```json
  {
    "password": "strongPassword123",
    "confirmString": "DELETE MY ACCOUNT"
  }
  ```
- **Scenario - Discard Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Account successfully deleted"
    }
  }
  ```
- **Scenario - Wrong Password or Confirm String (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Invalid password or confirmation string"
    }
  }
  ```
---

## 7. Invoice Management API (`/api/v1/invoices`)

All operations on invoices require authentication via a short-lived Access Token sent in the `Authorization: Bearer <token>` header.

### Endpoints Overview

#### 1. POST / (Create Invoice)
Creates a new invoice scoped to the authenticated user.
* **Body Requirements:**
  ```json
  {
    "invoiceNumber": "INV-2026-001",
    "clientName": "Acme Corporation",
    "clientEmail": "billing@acme.com",
    "dueDate": "2026-07-24T00:00:00.000Z",
    "items": [
      { "description": "Consulting Services", "quantity": 10, "price": 15000 },
      { "description": "Setup Fee", "quantity": 1, "price": 5000 }
    ],
    "status": "draft"
  }
  ```
  *(Note: All prices must be passed as integers representing values in cents, i.e., $150.00 is represented as `15000`)*.
* **Scenario - Success (201 Created):**
  Calculates the total amount automatically in the database (sum of `price * quantity`).
  ```json
  {
    "success": true,
    "data": {
      "_id": "6a3af380bd5659dd42e0b638",
      "userId": "6a3af395faf6e54fda885ac6",
      "invoiceNumber": "INV-2026-001",
      "clientName": "Acme Corporation",
      "clientEmail": "billing@acme.com",
      "dueDate": "2026-07-24T00:00:00.000Z",
      "items": [
        { "description": "Consulting Services", "quantity": 10, "price": 15000 },
        { "description": "Setup Fee", "quantity": 1, "price": 5000 }
      ],
      "status": "draft",
      "totalAmount": 155000,
      "isDeleted": false,
      "createdAt": "2026-06-24T02:30:00Z",
      "updatedAt": "2026-06-24T02:30:00Z"
    }
  }
  ```
* **Scenario - Duplicate Invoice Number (409 Conflict):**
  Fails if an invoice with the same `invoiceNumber` is already active for this specific user.
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "Invoice number is already in use"
    }
  }
  ```

#### 2. GET / (List Invoices)
Lists paginated, active invoices belonging to the user.
* **Query Parameters:**
  * `page` (optional, default: `1`): Page index.
  * `limit` (optional, default: `20`): Page size limit.
  * `status` (optional): Filter by invoice status (`draft`, `sent`, `paid`, `void`).
* **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```

#### 3. GET /:id (Get Invoice by ID)
Retrieves a single invoice.
* **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
* **Scenario - Unauthorized/IDOR Check (404 Not Found):**
  If the invoice does not exist OR belongs to another user, returns a `404 Not Found` to prevent account enumeration/IDOR.
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Invoice not found"
    }
  }
  ```

#### 4. PATCH /:id (Update Invoice)
Updates specified invoice details. Re-calculates `totalAmount` if `items` are updated.
* **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

#### 5. DELETE /:id (Soft Delete Invoice)
Soft deletes the invoice from the active list.
* **Scenario - Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Invoice successfully deleted"
    }
  }
  ```
  *(Note: Soft-deleted invoices allow their `invoiceNumber` to be reused due to database compound partial index filters).*

---

## 8. Troubleshooting & System Errors

### 1. Zod Validation Failures (400 Bad Request)
Returned when body parameters fail strict type checks.
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": [
      {
        "field": "email",
        "issue": "Invalid email"
      }
    ]
  }
}
```

### 2. Syntax Errors (400 Bad Request)
Occurs when the client sends malformed JSON.
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Unexpected non-whitespace character after JSON at position 77 (line 5 column 1)"
  }
}
```

---

## 9. Development Utility CLI

You can manage the Mongo database collections directly using `db-tool`:
- **Count users in the database:** `npm run db-tool -- --count`
- **List all users registered:** `npm run db-tool -- --list`
- **Create a user directly:** `npm run db-tool -- --create <email> <password>`
- **Delete a user by email:** `npm run db-tool -- --delete <email>`

