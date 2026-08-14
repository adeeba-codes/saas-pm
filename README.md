# Multi-Tenant SaaS Project Management Tool

A Jira/Linear-style project management tool with multi-tenant data isolation,
role-based access control, and real-time task board updates.

## Architecture

- **Backend:** Spring Boot (Java 17), PostgreSQL, Spring Security + JWT, WebSocket (STOMP)
- **Frontend:** React (Vite), react-router, axios, @stomp/stompjs for WebSocket
- **Core pattern:** every piece of data belongs to an `Organization` (tenant).
  All queries are filtered by `organizationId`, which is extracted from the
  JWT on every request — never trusted from client input. See
  `TenantIsolationTest.java` for a test that proves cross-tenant access is blocked.

---

## Step 1: Install prerequisites

1. **Java 17** — `sudo apt install openjdk-17-jdk` (Linux) or download from adoptium.net
2. **Maven** — `sudo apt install maven` or download from maven.apache.org
3. **PostgreSQL** — `sudo apt install postgresql` or download from postgresql.org
4. **Node.js (v18+)** — download from nodejs.org
5. An IDE — VS Code (with Java + Spring Boot extension packs) or IntelliJ

## Step 2: Set up the database

```bash
# Open the Postgres shell
sudo -u postgres psql

# Inside the shell:
CREATE DATABASE saas_pm;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE saas_pm TO postgres;
\q
```

If your local Postgres already has different credentials, update
`backend/src/main/resources/application.properties` to match.

## Step 3: Run the backend

```bash
cd backend
mvn spring-boot:run
```

This starts the API on `http://localhost:8080`. Hibernate will
auto-create all tables (`organizations`, `app_users`, `projects`, `tasks`)
on first run because of `spring.jpa.hibernate.ddl-auto=update`.

**Verify it's working:**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"organizationName":"Acme Inc","email":"admin@acme.com","password":"test1234"}'
```
You should get back a JSON response with a `token`.

## Step 4: Run the tenant isolation test

This is the test you show in interviews — it proves isolation works,
not just claims it:

```bash
cd backend
mvn test -Dtest=TenantIsolationTest
```

## Step 5: Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. Sign up, create a project, add tasks,
and drag them between statuses.

**To see the real-time feature in action:** open the same project board
in two browser tabs (or two different browsers). Move a task's status in
one tab — it updates instantly in the other, with no refresh.

## Step 6: Deploy

- **Backend:** Render, Railway, or Fly.io all support Spring Boot deployments.
  You'll need a managed Postgres instance (Render and Railway both offer free tiers).
- **Frontend:** Netlify or Vercel — `npm run build` produces a static `dist/`
  folder to deploy.
- Update `frontend/src/api/client.js` and `ProjectBoard.jsx`'s WebSocket URL
  to point at your deployed backend URL instead of `localhost:8080`.

## What's implemented vs. what's a stretch goal

**Implemented:**
- Signup/login with JWT
- Multi-tenant data isolation (verified by test)
- Role-based access control (ADMIN/MEMBER/VIEWER, enforced server-side)
- Project + task CRUD
- Real-time task board via WebSocket (STOMP)

**Not implemented — mention as "future work" or build if you have time:**
- Inviting additional users to an existing organization (currently, signup
  always creates a brand new org — you'd add an `/api/invite` endpoint)
- Subscription tier enforcement (the `SubscriptionTier` field exists on
  `Organization` but nothing currently checks it — e.g. blocking a FREE
  tier org from creating more than 3 projects)
- Presence indicators (showing who else is viewing the board right now)
- Password reset / email verification

## What to say in an interview

- "I implemented row-level multi-tenancy — every table is scoped by
  organization ID, and I wrote a test that proves cross-tenant access
  fails, not just assumed it."
- "The JWT carries the organization ID and role as claims, so the
  backend never needs a database lookup just to know which tenant a
  request belongs to."
- "Real-time updates use STOMP over WebSockets — when one user moves
  a task, everyone else viewing that board sees it update within
  [measure this yourself once deployed] milliseconds."
