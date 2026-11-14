# Finpal

A calm, profile-based personal finance workspace built with Next.js, React, TypeScript, and Firebase. It includes reusable time-ranged budget profiles with grouped income allocations, editable income/expense and asset records, currency preferences, flexible retirement and FIRE projections, saving and investment planners, home-loan payoff comparisons, and persistent savings goals.

## Run locally

1. Install Node.js 20.19 or newer.
2. Run `npm install`.
3. Run `npm run dev`, then open `http://localhost:3000`.

Firebase's public Web app configuration is included in `src/lib/firebase-config.ts`, so no environment variables are needed to run locally or deploy. Choose **Continue with Google** to authenticate with the shared Finpal project. Signed-in profiles are stored in that project's Firestore under the authenticated user's UID on localhost and on deployed domains. Older UID-keyed local account data is migrated to Firestore when the cloud account has no profiles. Demo mode stays browser-local and is not synced.

Before the first local sign-in, enable the Google provider and authorize `localhost` under Firebase Authentication → Settings → Authorized domains. Firestore must also be enabled and the checked-in security rules deployed. Run the app at `http://localhost:3000`; if you prefer `127.0.0.1`, add that host as well if Firebase accepts it. See [Firebase setup and deployment](./doc/deployment.md).

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`

See [Firebase deployment](./doc/deployment.md), [design](./doc/design/overview.md), and the [delivery stages](./doc/roadmap.md).
