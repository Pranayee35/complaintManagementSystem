# Smart Complaint Management System

Campus-wide complaint management: students raise complaints, admins resolve them, super admins monitor everything.

## Stack

- **Next.js 14** (App Router), **JavaScript** (no TypeScript)
- **Tailwind CSS**
- **Prisma** + **SQLite**
- **NextAuth.js** (Credentials + JWT)
- **bcrypt** for password hashing
- **Server Actions** + route protection via middleware
- **ESLint** enabled (`npm run lint`)

## Setup

1. **Copy environment file**
   ```bash
   cp .env.example .env
   ```
2. **Set in `.env`**
   - `DATABASE_URL="file:./dev.db"` (default)
   - `NEXTAUTH_SECRET` — use a long random string (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL="http://localhost:3000"`
   - `ALLOW_ADMIN_SIGNUP="true"` if you want to sign up as Admin/Super Admin (default: `false`)

3. **Install and DB**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Auth

- **Signup:** `/signup` — default role **Student**. Admin/Super Admin only if `ALLOW_ADMIN_SIGNUP=true`.
- **Login:** `/login` — email + password, JWT session.
- **Logout:** Sign out clears the session and redirects to `/login` (no cached session on protected routes).
- No mock auth; no hardcoded users. Duplicate emails are rejected.

## Roles

| Role         | Dashboard              | Capabilities |
|-------------|------------------------|--------------|
| **Student** | `/student/dashboard`   | Raise one active complaint at a time; view own complaints; real-time status (polling). |
| **Admin**   | `/admin/dashboard`     | View unclaimed complaints; claim one at a time; update status (SUBMITTED → CLAIMED → IN_PROGRESS → RESOLVED → CLOSED). |
| **Super Admin** | `/super-admin/dashboard` | View all complaints; filter escalated; simple analytics (counts). |

## Time-based rules

- **30 min** unclaimed → priority set to **HIGH**.
- **24 h** unresolved (SUBMITTED/CLAIMED/IN_PROGRESS) → **escalated** (visible to Super Admin).  
Applied on read (no cron).

## Status flow

Strict: `SUBMITTED → CLAIMED → IN_PROGRESS → RESOLVED → CLOSED` (no skipping).

## Real-time

Dashboards use **polling** (every 6–8 s) to refresh complaint lists and status.
