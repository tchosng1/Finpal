# Finpal

A calm, profile-based personal finance workspace built with Next.js, React, TypeScript, and Firebase. It includes reusable time-ranged budget profiles with grouped income allocations, editable income/expense and asset records, currency preferences, flexible retirement and FIRE projections, saving and investment planners, home-loan payoff comparisons, and persistent savings goals.

## Run locally

1. Install Node.js 20.19 or newer.
2. Run `npm install`.
3. Run `npm run dev`, then open `http://localhost:3000`.

Firebase's public Web app configuration is included in `src/lib/firebase-config.ts`, so no environment variables are needed to run locally or deploy. Users can sign in with Google, any email/password account (including Hotmail addresses), or Microsoft (after enabling it in Firebase). Identity is separate from the storage destination chosen in **Settings**: shared Finpal Firestore, Google Drive, Microsoft OneDrive, or this browser only. Shared Firestore is private per Firebase UID; Drive and OneDrive store the profile list in each provider's app-only folder. Storage destinations are separate and switching does not copy data automatically. OAuth app client IDs for the optional personal cloud destinations are configured in `src/lib/storage-config.ts`; the shared Firebase option works without them.

Before the first local sign-in, enable the Google provider and authorize `localhost` under Firebase Authentication → Settings → Authorized domains. Enable Email/Password for generic email addresses; configure Microsoft in Firebase Authentication for Microsoft single sign-on. Firestore must also be enabled and the checked-in security rules deployed. Run the app at `http://localhost:3000`; if you prefer `127.0.0.1`, add that host as well if Firebase accepts it. See [Firebase deployment](./doc/deployment.md) and [identity/storage provider setup](./doc/storage-providers.md).

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`

See [Firebase deployment](./doc/deployment.md), [design](./doc/design/overview.md), and the [delivery stages](./doc/roadmap.md).
