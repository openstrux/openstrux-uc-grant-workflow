## Context

The grant workflow application needs a working frontend before any backend is implemented. Building frontend-first with stubbed service interfaces lets the UI be developed and reviewed independently, and defines the exact contract the backend must satisfy.

The app is a Next.js 16 / React 19 project using the App Router, rooted at `src/app/`. All pages call service functions from `src/server/services/`. Stubs return empty data or throw, so the app compiles and runs without a real backend.

## Goals / Non-Goals

**Goals:**
- Deliver all workflow screens for P0–P2: proposal intake, admin dashboard, proposal detail, eligibility check
- Define the service interface contract (`src/server/services/`) that backend implementation must honour
- Keep all pages runnable with stub services so the full app route structure is exercisable

**Non-Goals:**
- Real authentication or session management (backend concern)
- Backend implementation (covered by the backend change)
- Any screens outside P0–P2 workflow scope

## Decisions

**Service stub pattern**: All server components and route handlers import exclusively from `src/server/services/`. Stubs throw or return empty data. The backend change replaces stub implementations without touching UI code. Rationale: decouples frontend development from backend readiness and makes the service contract explicit and testable.

**App Router, server components by default**: `"use client"` is used only where state or browser effects are required (submit form, eligibility form). Server components call service functions directly. Rationale: aligns with Next.js 16 conventions; avoids unnecessary client bundles.

**Pseudonymous intake**: The submission form collects an applicant alias (pseudonym) rather than real identity. Identity handling is the backend's responsibility. The UI passes the alias and lets the backend separate it from proposal content.

**No UI framework**: Plain CSS with CSS variables (`src/styles/globals.css`). Rationale: keeps the dependency surface minimal; visual design is not the focus of this use case.

## Risks / Trade-offs

**Stub signature drift**: If the backend change needs different service signatures, stubs and UI callers must be updated together. Mitigation: types are co-located with each service file; changes are localised and visible.

**No suspense boundaries on server components**: Admin and detail pages await services synchronously — no streaming or skeleton states. Mitigation: acceptable for the current scope; production hardening is deferred.

## Migration Plan

No migration needed. Greenfield frontend; backend change fills in stub implementations.

## Open Questions

None — implementation is complete.
