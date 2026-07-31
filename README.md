# ALR — Annual Learning Record Platform

A full-stack platform for **Centurion University of Technology and Management (CUTM)** that digitises the Annual Learning Record: it **traces every student's learning** course-by-course, evaluates it through three committee tiers, and carries it into credit and accreditation exports.

Built as a single deployable **Next.js 14 (App Router)** application — frontend and backend together — on **PostgreSQL** via **Prisma**, designed to be cost-optimised and horizontally scalable.

---

## What it does

The platform is modelled directly on the institutional review + Learning Record Framework. Every recommendation in that document maps to a concrete feature:

| Framework requirement | How it's implemented |
| --- | --- |
| **12-way subject → record mapping**, incl. combination subjects needing several records | `src/lib/domain.ts` encodes all twelve configurations → required record types. A combination subject (e.g. *Theory + Practice*) surfaces **multiple concurrent records**, each tracked and scored independently. |
| **6 record types with subject weights** (Classroom 10%, Applied & Action 20%, Action 30%, Project/Thesis/Internship 30%) | `RECORD_TYPES` spec with per-entry scale, rubric, and weight. |
| **Explicit, configurable normalization** (e.g. `avg/50 × 20`) | `normalizeToWeight()` — the formula is stored on each record (`normalizationNote`) and shown in the UI, never implicit. |
| **Three evaluation tiers** — subject-wise, year-wise, program-wise | Subject: faculty review with AI assist. Year: Dean's committee 5-criterion / 100-mark rubric. Program: cumulated marks + credit. |
| **Credit ledger** — 1 credit/year, Compulsory Basket | `CreditLedgerEntry`; posted automatically on annual sign-off; student ledger + progress view. |
| **Distinct roles** — Student, Faculty (CO), Mentor (PO/PSO), HoD, Dean, Admin, Industry Supervisor | Role-based navigation, scoping, and permissions throughout. |
| **Sequential, timestamped sign-off chains** | `SignoffStep` (Faculty → Mentor → HoD), rendered as a live chain on each record. |
| **Normalization + AI scoring with human override / appeal** | Optional AI advisory score (provider-agnostic); faculty score always authoritative; students can file logged appeals. |
| **Plagiarism thresholds per document type** (Thesis 20%, others 30%) | `PLAGIARISM_THRESHOLDS`, deliverable + case models. |
| **Tokenised industry-supervisor access (no login)** | `/industry/[token]` public route; one-time signed link for external assessment. |
| **MOOC as first-class, 6-campus filtering, NAAC/NBA evidence** | MOOC configurations; campus dimension on every course; analytics dashboards. |
| **E-declaration on first login, optional MFA, books/manuals field** | Profile page (declaration + MFA); `booksReferred` on records. |

---

## Tech stack

- **Next.js 14** (App Router, Server Components, Server Actions) — one codebase for UI + API
- **PostgreSQL + Prisma** — relational model fits the workflow/sign-off domain
- **Auth**: stateless JWT in an httpOnly cookie (`jose` + `bcryptjs`) — no session store to scale
- **Tailwind CSS** — custom "Registrar's Ledger" design system
- **recharts** — analytics
- **Zod** — input validation

---

## Quickstart (local)

**Prerequisites:** Node.js ≥ 18.18 and a PostgreSQL database.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    → set DATABASE_URL and AUTH_SECRET (generate one: openssl rand -base64 48)

# 3. Create the schema (first time — no migration history needed)
npx prisma db push
#    (or, to keep migration history:  npx prisma migrate dev --name init )

# 4. Seed demo data (campuses, roles, combination courses, traced records)
npm run db:seed

# 5. Run
npm run dev
#    → http://localhost:3000
```

### Demo accounts (after seeding)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@cutm.ac.in` | `Admin@12345` |
| Dean | `dean@cutm.ac.in` | `Cutm@12345` |
| HoD | `hod@cutm.ac.in` | `Cutm@12345` |
| Faculty | `faculty@cutm.ac.in` | `Cutm@12345` |
| Mentor | `mentor@cutm.ac.in` | `Cutm@12345` |
| Student | `cse21001@cutm.ac.in` | `Cutm@12345` |

Industry supervisor demo link: `/industry/demo-industry-token-cs21002`

> The **first account you register** on a fresh database automatically becomes an **Admin** — so you can also skip the seed and bootstrap your own.

---

## Quickstart (Docker)

Brings up PostgreSQL + the app together:

```bash
docker compose up --build
# schema is applied automatically on container start
# then seed once:
docker compose exec app npx tsx prisma/seed.ts
# → http://localhost:3000
```

---

## Deploying to Vercel / any host

1. Push to a Git repo and import into Vercel.
2. Set env vars: `DATABASE_URL` (use a **pooled** connection string), `AUTH_SECRET`, and optionally the AI keys.
3. Run migrations once against your database: `npx prisma migrate deploy` (or `prisma db push`).
4. Build command is `npm run build` (runs `prisma generate` + `next build`); output is standalone.

The app also runs as a plain container anywhere (`output: 'standalone'`): the included `Dockerfile` produces a minimal image that applies the schema on boot and serves `server.js`.

---

## Optional: AI-assisted scoring

Set `AI_PROVIDER` to `anthropic` or `openai` in `.env` and provide the matching API key. When configured, faculty can request an **advisory** score + summary on a record. It is always overridable, and students can appeal — no automated decision is final. Leave `AI_PROVIDER` empty to disable AI entirely; the platform is fully functional without it.

---

## Cost & scalability notes

- **Single deployable, scale-to-zero friendly.** Server Components query the database directly; there's no separate API tier to run or pay for.
- **Stateless auth.** Sessions are signed JWTs in cookies — no Redis/session store, so instances scale horizontally with nothing shared.
- **Bounded DB connections.** One pooled Prisma client per instance; point `DATABASE_URL` at a pooler (PgBouncer / Neon / Supabase pooling) for serverless.
- **Standalone output** keeps the container image and cold-start small.
- **Indexed schema** on the hot paths (records by student/status, courses by campus/department, sign-off lookups).

---

## Project structure

```
prisma/schema.prisma      # full domain model (records, tiers, credit, sign-off, plagiarism)
prisma/seed.ts            # demo data that exercises the whole trace
src/lib/domain.ts         # the Learning Record Framework, encoded (weights + normalization)
src/lib/                  # auth, session, db (lazy Prisma), ai, queries, env
src/app/(auth)/           # login / register
src/app/(app)/            # dashboard, records, courses, review, evaluations, credits, analytics, admin, profile
src/app/(industry)/       # tokenised external-supervisor route (no login)
src/middleware.ts         # edge auth guard
```
