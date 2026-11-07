# Security policy

## Reporting a vulnerability

Please report security issues privately to the repository owner through GitHub's private vulnerability reporting feature. Do not open a public issue containing exploit details, credentials, or personal data. Include the affected version or commit, impact, and steps to reproduce.

## Background Remover protections

The `/api/remove-background` Pages Function requires the server-only `REMOVEBG_API_KEY`, `TURNSTILE_SECRET_KEY`, public `VITE_TURNSTILE_SITE_KEY`, and a KV namespace bound as `RATE_LIMIT_KV`. It verifies Turnstile tokens and limits each Cloudflare client IP to five requests per minute. The KV counter is a lightweight abuse barrier; configure a Cloudflare WAF rate-limiting rule as an additional edge control. The request image is forwarded to remove.bg and is not stored by this project.

Never commit API keys, `.dev.vars*`, or `.env*` files. Rotate a credential immediately if it is exposed.
