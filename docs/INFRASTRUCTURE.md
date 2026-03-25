# Alien Eyes -- Infrastructure

> Version: 1.0
> Date: 2026-03-11
> Scope: Phase 0 web-first runtime topology

## Split

- `Vercel`: Next.js frontend + API routes only
- `Railway` or `Fly.io`: worker processes for Playwright and BullMQ consumers
- `Upstash Redis`: BullMQ queue backend
- `Supabase`: Postgres + Storage buckets

## Why Workers Are Separate

Playwright requires:
- long-running processes (30-120s crawls)
- writable filesystem
- more memory than Vercel is comfortable with

Vercel remains the control plane.
Workers remain the execution plane.

## Data Flow

1. User submits URL via web app or API route on Vercel.
2. API route validates input and enqueues an audit job in Redis/BullMQ.
3. Worker process picks up the job, runs crawl + extraction + primitives.
4. Worker writes crawl metadata, primitive outputs, findings, and reports to Supabase.
5. API routes and frontend poll Supabase / job status and render progress/results.

## Worker Process Responsibilities

- consume BullMQ jobs
- launch Playwright in clean profiles
- run audit pipeline
- record cost and timing metadata
- persist outputs to Supabase
- expose health probes

## Health Checks

Worker must expose:
- `GET /healthz`: process is alive
- `GET /readyz`: worker can reach Redis and Supabase, and can accept jobs

## Environment Variables

### Frontend / API (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL` or Redis connection details
- `UPSTASH_REDIS_REST_TOKEN` or Redis auth details
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `CLOUDFLARE_TURNSTILE_SITE_KEY`
- `CLOUDFLARE_TURNSTILE_SECRET_KEY`

### Workers (Railway/Fly.io)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `NODE_ENV`
- `PORT`

## Deployment Notes

- Vercel and worker deployments are separate pipelines.
- Network policy on worker host must block private IP egress for SSRF defense.
- Worker images should be rebuilt when Playwright version changes.
- Storage lifecycle should delete raw crawl artifacts within 24 hours.
