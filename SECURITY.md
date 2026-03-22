# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it responsibly by emailing info@homofaberconsulting.com.

Do not open a public issue for security vulnerabilities.

## Scope

This is an MVP demonstration repository. It is not intended for production deployment without additional hardening:

- Keycloak configuration is illustrative, not production-hardened.
- No rate limiting is implemented.
- No CSRF protection beyond Next.js defaults.
- Secrets in `.env.example` are placeholders only.

## Supported versions

Only the latest version on the `main` branch receives security fixes.
