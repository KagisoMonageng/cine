# Bursary Platform Backend (Express + PostgreSQL)

Production-oriented MVP backend for a bursary application platform with social engagement features.

## Core Stack
- Node.js + Express
- PostgreSQL (`pg`)
- JWT auth + role-based authorization
- `bcrypt` password hashing
- `multer` uploads
- Security middleware: Helmet, CORS, rate limiting

## Roles
- `learner`: browse bursaries, submit applications, upload documents, track statuses, enrich profile, follow users, post updates, and like posts.
- `provider`: create/update/close bursaries, review applications/documents, update statuses, enrich profile, and use social features.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file and configure values:
   ```bash
   cp .env.example .env
   ```
3. Ensure PostgreSQL is running and `DATABASE_URL` points to your DB.
4. Initialize schema:
   ```bash
   npm run db:init
   ```
5. Start server:
   ```bash
   npm run dev
   ```
6. Open Swagger docs:
   - UI: `http://localhost:5000/docs`
   - OpenAPI JSON: `http://localhost:5000/docs/openapi.json`

## API Summary

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Bursaries
- `GET /api/bursaries` (public, open bursaries)
- `POST /api/bursaries` (provider)
- `PATCH /api/bursaries/:id` (provider owner)
- `PATCH /api/bursaries/:id/close` (provider owner)

### Applications
- `POST /api/applications` (learner)
- `GET /api/applications/mine` (learner)
- `POST /api/applications/:applicationId/documents` (learner, form field: `document`)
- `GET /api/applications/:applicationId/documents` (learner owner or provider owner)
- `GET /api/applications/provider/bursary/:bursaryId` (provider owner)
- `PATCH /api/applications/provider/:applicationId/status` (provider owner)

### Profiles
- `GET /api/profiles/me` (authenticated user)
- `PATCH /api/profiles/me` (authenticated user)
- `GET /api/profiles/:userId` (authenticated user, public profile + stats)

### Social (Follow / Post / Like)
- `POST /api/social/follow/:userId` (follow user)
- `DELETE /api/social/follow/:userId` (unfollow user)
- `GET /api/social/followers` (my followers)
- `GET /api/social/following` (users I follow)
- `POST /api/social/posts` (create post)
- `GET /api/social/feed` (my + following posts)
- `POST /api/social/posts/:postId/like` (like post)
- `DELETE /api/social/posts/:postId/like` (unlike post)

### Health
- `GET /health`

### API Documentation (Swagger/OpenAPI)
- `GET /docs` (Swagger UI)
- `GET /docs/openapi.json` (raw OpenAPI spec)

## Security Choices
- Passwords hashed with bcrypt (12 rounds).
- JWT signed with a configurable secret.
- Helmet secure headers.
- CORS origin restriction from environment.
- Rate limiting under `/api`.
- Parameterized SQL queries to reduce injection risk.

## Notes for Angular Frontend
The backend is frontend-agnostic and ready for Angular 21 + NgRx Signals integration. Use the bearer JWT from login/register on all protected routes.
