# Bilet Feed — Production Deployment Guide

## Prerequisites

- PostgreSQL database (Neon, Supabase, or Vercel Postgres)
- Firebase project with Authentication + Storage enabled
- Vercel account
- Custom domain (optional)

## 1. Environment Variables

Copy `.env.example` to `.env.local` for local development. In Vercel, set:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL (`https://yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as SITE_URL |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Yes | Domain without protocol (`yourdomain.com`) |
| `NEXT_PUBLIC_CANONICAL_HOST` | Yes | Non-www host (`yourdomain.com`) |
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase web app config (6 vars) |
| `FIREBASE_ADMIN_*` | Yes | Firebase service account (3 vars) |
| `TICKET_SECRET_KEY` | Yes | Strong random secret for QR ticket signing (separate from session) |
| `NEXTAUTH_SECRET` | Yes | Strong random secret for session cookie HMAC |
| `SUPER_ADMIN_EMAILS` | Yes | Comma-separated bootstrap superadmin emails |
| `CRON_SECRET` | Yes | Bearer token for cron/scrape endpoints |
| `UPSTASH_REDIS_REST_URL` | Prod | Upstash Redis REST URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Prod | Upstash Redis REST token |
| `RESEND_API_KEY` | Prod | Email delivery (log-only if missing) |
| `PAYMENT_PROVIDER` | Prod | `iyzico` after provider implementation |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | Prod | iyzico credentials (when live) |
| `ENABLE_MOCK_PAYMENTS` | Never in prod | Development only — must be unset/false in production |

## 2. Database Setup

```bash
npm run db:push      # Push schema to PostgreSQL
npm run db:seed      # Seed cities + categories
npm run seed:event-rules  # Event rule catalog (organizer wizard)
# or all at once:
npm run db:setup     # push + seed + event-rules
npm run db:migrate   # Or use migrations for production
```

## 3. Firebase Setup

1. Create Firebase project
2. Enable **Email/Password** and **Google** sign-in
3. Enable **Storage** (for event images)
4. Create Web App → copy client config to `NEXT_PUBLIC_FIREBASE_*`
5. Service Accounts → Generate key → set `FIREBASE_ADMIN_*`
6. Add authorized domains: `localhost`, `yourdomain.com`, `*.vercel.app`

## 4. Domain Setup

1. Add domain in Vercel project settings
2. Set DNS records per Vercel instructions
3. Set `NEXT_PUBLIC_CANONICAL_HOST=yourdomain.com` (non-www)
4. Middleware auto-redirects `www` → canonical host

## 5. Vercel Deploy

```bash
git push origin main   # Auto-deploy if connected
# or
vercel --prod
```

Build command: `npm run build` (includes `prisma generate`)

## 6. Post-Deploy Checklist

- [ ] Homepage loads with events from PostgreSQL
- [ ] `npm run setup:check` passes (or only expected warnings)
- [ ] Event rule catalog seeded (`npm run seed:event-rules`)
- [ ] Google + Email login works
- [ ] Session cookie created after login
- [ ] `/dashboard` blocked for ROLE_USER
- [ ] `/admin` blocked for non-admins
- [ ] `/robots.txt` and `/sitemap.xml` accessible
- [ ] Open Graph URLs use canonical domain
- [ ] Firebase Storage uploads work (if used)

## 7. Performance

- Images: Firebase Storage + Next.js Image (optimized in production)
- Fonts: Plus Jakarta Sans via `next/font`
- Server Components used for data-heavy pages
- Client components receive pre-fetched props

## 8. Assign Admin Role

After first login, update role in PostgreSQL:

```sql
UPDATE users SET role = 'ROLE_ADMIN' WHERE email = 'admin@yourdomain.com';
```

User must re-login for Firebase custom claims to refresh.
