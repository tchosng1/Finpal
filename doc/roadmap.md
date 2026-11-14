# Delivery stages

## Stage 1 — Foundation and visual system

- Initialize a strict TypeScript Next.js App Router application.
- Define the profile-scoped finance data model and consistent design tokens.
- Build the responsive navigation shell and no-configuration demo entry.
- **Exit check:** app starts locally, is responsive, and demo mode can be entered without Firebase.

## Stage 2 — Profiles and identity

- Add Firebase Google, Microsoft, and email/password authentication when each method is enabled.
- Support multiple people under a signed-in owner, with profile switching and separate financial state.
- Persist demo data locally and let authenticated users choose shared Firestore, Google Drive, OneDrive, or browser-only storage.
- Add owner-only Firestore rules.
- **Exit check:** profile switching preserves context; no cross-profile state is reused.

## Stage 3 — Personal finance modules

- Create the dashboard metrics and wealth trend.
- Add dated income/expense transactions, category budgets, and manually tracked assets.
- Add editable retirement balance/age and transparent forecast assumptions.
- **Exit check:** each workflow visibly updates its relevant view and is saved to the active profile.

## Stage 4 — Cloud deployment and hardening

- Deploy as a server-rendered Next.js app through Firebase App Hosting.
- Configure Google provider, authorized domains, public Firebase client environment values, and Firestore rules.
- Validate type safety, lint, production build, and browser workflows.
- **Exit check:** deployed sign-in, persistence, mobile navigation, and profile isolation are checked with real Firebase credentials before public launch.

## Current release boundary and follow-up

The delivered app is a functional MVP and demo. Shared Firebase storage requires the Firestore database, authorized domains, Google sign-in, and deployed rules. Microsoft identity requires the Firebase Microsoft provider and an Entra app registration. Personal Google Drive/OneDrive storage requires OAuth app registrations configured in `src/lib/storage-config.ts`; without these IDs, the shared Firestore and device-only choices remain available. Provider consent and real cloud round-trips must be verified with owner credentials before public launch. Storage destinations are independent; automatic migration between them is not implemented. Next recommended work: add an explicit migration/export/import workflow, unit tests for calculations and Firebase rules, transaction-driven budget actuals, liabilities, schema versioning, and real-device accessibility review.
