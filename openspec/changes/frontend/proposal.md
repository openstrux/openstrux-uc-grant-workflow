## Why

The grant workflow application needs a pre-built frontend that defines the service interfaces both generation paths must satisfy. Pre-building the frontend ensures comparison fairness: both the direct and Openstrux generation paths start from the same baseline and only differ in backend implementation.

## What Changes

- Next.js 15 frontend in `app/web/` with workflow screens for P0-P2
- Forms: proposal intake, eligibility inputs
- Navigation: dashboard, submission detail, results viewer
- Results viewer page at `/results` reading `results/*/benchmark.json`
- All pages call predefined service interface stubs in `app/web/src/server/services/`

## Status: ARCHIVED
