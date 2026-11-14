# Delivery stages

## Stage 1 — Foundation and visual system

- Initialize a strict TypeScript Next.js App Router application.
- Define the profile-scoped finance data model and consistent design tokens.
- Build the responsive navigation shell and no-configuration demo entry.
- **Exit check:** app starts locally, is responsive, and demo mode can be entered without Firebase.

## Stage 2 — Profiles and identity

- Add Firebase Google authentication when a Firebase web app is configured.
- Support multiple people under a signed-in owner, with profile switching and separate financial state.
- Persist demo data locally and authenticated data in profile-specific Firestore documents.
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

The delivered app is a functional MVP and demo. Public Firebase sign-in/cloud sync requires the Google provider, Firestore database, authorized domains, and deployed security rules to be configured in the shared Firebase project. Automated UI checks can exercise demo mode locally, but production OAuth and Firestore access must be verified with the project owner’s credentials. Reusable budget profiles now model a percentage allocation over a date range and report annual planned totals. FIRE goal projections show a separate post-FI return and a fixed annual withdrawal based on the FI balance. Next recommended work: add unit tests for financial calculations and Firebase rules, transaction-driven budget actuals, liabilities, schema versioning, and real-device accessibility review.
