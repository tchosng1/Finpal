# Finpal — product and design overview

## Product intent

Finpal is a personal financial home for understanding the present and planning ahead. It should make everyday money choices feel clearer without presenting estimates as guarantees or overwhelming people with trading-terminal complexity.

### Primary goals

- Offer one quick, understandable overview of income, spending, savings, net worth, and progress.
- Let one signed-in household manage multiple people without mixing their records.
- Support practical budgeting, transaction tracking, property and investment asset tracking, forecasting, and retirement assumptions.
- Keep the module boundaries and data model easy to extend.
- Work as a server-rendered Next.js app on Firebase App Hosting.

### Non-goals for this release

- Connecting to banks or brokerages, trading, tax filing, financial advice, or real-time market pricing.
- Shared editing permissions between multiple Google accounts.
- Treating seeded demo values or a projection as verified account data or a guaranteed return.

## Navigation and information architecture

| Area | Purpose | Key actions |
|---|---|---|
| Overview | Household member’s financial snapshot | Review net worth, monthly income/outflow, savings rate, budget progress, recent activity, assets |
| Activity | Income and expense ledger | Add, edit, or remove a dated, categorized transaction |
| Budgets | Monthly categories plus reusable allocation profiles | Group categories, assign an income percentage, and apply a named profile across a selected month range with yearly totals; edit or clone profiles |
| Assets | Manually tracked balance sheet | Add, edit, or remove property, investment, share, or cash values |
| Forecast | Long-range illustration and budget schedule | Review retirement assumptions and budget allocations by calendar year |
| Retirement | Editable retirement assumptions | Adjust current age, retirement balance and age, annual return, and contribution rate |
| Saving planner | Scenario calculator | Compare starting savings, contribution, return, and horizon with a visual chart and annual table |
| Investment planner | Scenario calculator | Model a starting investment and regular contributions over time |
| Home loan planner | Payoff comparison | Compare scheduled and additional payments, payoff time, interest, chart, and yearly balances |
| Goals | Savings and FIRE planning | Edit profile-specific goals; project accumulation, FI milestone, fixed annual withdrawals, and post-FI balance visually and in a yearly table |
| Settings | Profile and account preferences | Set profile currency and choose shared, Google Drive, OneDrive, or device-only storage |
| Profile switcher | Separate financial context per person | Switch, create, and manage each person’s data independently |

## Interaction and visual principles

- **Calm first:** soft neutral surfaces, indigo used for orientation, green reserved for positive movement, and restrained chart detail.
- **Progressive disclosure:** the overview is concise; dedicated modules carry their own detail and next action.
- **Clear ownership:** every profile owns its own transactions, budgets, assumptions, and assets. The selected profile is visible in the persistent sidebar.
- **Actionable but forgiving:** prominent add actions, clear empty states, inline feedback, and simple category editing.
- **Responsive:** a persistent desktop rail becomes a mobile drawer; cards and forms reflow for small screens.
- **Accessible basics:** semantic sections and labels, keyboard-operable buttons/forms, dialog roles, descriptive chart labels, and visible focus styles.

## Application architecture

```text
Next.js App Router (server-rendered route and metadata)
└── Client finance workspace
    ├── Profile-scoped finance domain (src/lib/finance.ts)
    ├── Firebase Auth (Google, Microsoft, and email/password)
    ├── Storage adapter (src/lib/storage.ts)
    │   ├── Shared Firebase Firestore
    │   ├── Google Drive appData folder
    │   ├── Microsoft OneDrive app folder
    │   └── Browser localStorage
    └── Local demo adapter (browser localStorage)
```

The route and metadata use the Next.js App Router; the interactive finance workspace is a client component. The domain model in `src/lib/finance.ts` is the shared boundary for the UI and storage adapters. `src/lib/firebase.ts` provides the Firebase-specific operations. For future modules, add domain types and operations there, then introduce a dedicated module component and navigation entry rather than coupling data access to the page route.

### Persistence and identity

- Google and Microsoft identities are provided by Firebase Authentication when their providers are enabled in the shared project. Email/password supports any email address with a Finpal password. Microsoft support requires an Entra app registration and Firebase provider setup.
- Storage is selected separately from identity and remembered per Firebase UID in browser localStorage. The selection is never treated as proof of provider access.
- Shared Finpal Firestore stores documents at `users/{uid}/profiles/{profileId}`. This remains the default and needs no external Drive/OneDrive client configuration.
- Firestore rules allow a user to read/write only their own profile documents; profile IDs are checked against document IDs.
- Google Drive stores the profile list in its hidden `appDataFolder`, using a separately consented `drive.appdata` OAuth scope. Google access tokens remain in memory and expire; the user must reconnect after a page reload or token expiration.
- OneDrive stores the profile list in the connected user's app folder via Microsoft Graph with delegated `Files.ReadWrite.AppFolder` permission. MSAL caches provider tokens in session storage and silently refreshes when possible.
- Device-only storage uses a UID-specific localStorage key and does not sync to another browser/device.
- Changing storage destinations does not automatically move data. Each provider owns an independent profile list; the user must export/import or manually recreate data before switching (migration UX remains future work).
- Demo workspace data is stored in this browser’s local storage and is not uploaded.
- The app shows selected-storage load/save errors and sync status rather than silently switching a signed-in account to another destination.
- If an earlier version left UID-keyed authenticated profiles in local storage and the corresponding cloud account has no profiles yet, the app uploads those profiles to Firestore and removes the local copy only after all profile writes succeed.
- Currency selection is profile-specific and changes formatting only; it does not apply exchange-rate conversion.
- The shared Finpal Firebase Web app config is bundled in `src/lib/firebase-config.ts`. End users and App Hosting do not need to configure Firebase at runtime. The web API key is a public Firebase client identifier; authorization is enforced by Firebase Auth and Firestore rules, not by hiding the key.
- Signing in with a Google or Microsoft account does not itself grant cloud storage access. Drive and OneDrive must be explicitly connected separately. Shared Finpal Firestore is administered by the Finpal project owner; device-only storage remains on the current browser.

### Financial calculation boundaries

- Net worth on this first release is the sum of manually entered assets; liability tracking is a future module.
- Month-to-date totals use dated transactions in the current local month.
- Budget spending targets and displayed budget progress are profile-owned values, independent of transaction categorization in this first iteration. Reusable budget profiles snapshot a monthly income basis, assign categories to user-defined groups, and allocate a percentage of income across a non-overlapping month range. Their annual table prorates each calendar year by months covered.
- Forecast and retirement illustrations use each profile’s editable annual return and contribution-rate assumptions (default 6% and 12%). Savings and FIRE goals have separate accumulation and post-FI assumptions. The FIRE table compounds the FI balance at the post-FI return and subtracts a fixed annual withdrawal equal to the selected withdrawal rate times the balance at the FI milestone; this is a simplified illustration and does not include inflation adjustment, taxes, or fees.
- Age and numeric values are committed after field editing rather than clamped while typing. Saving/investment/goal projections compound monthly; loan estimates use monthly amortization with constant interest and payment. They are educational scenarios, not advice, guarantees, or live portfolio valuations.

## Future extension points

1. Add liabilities and account reconciliation to turn total assets into net worth.
2. Add recurring income/expense schedules and month-by-month budget actuals.
3. Introduce a versioned persistence schema and migration functions before changing stored profile shapes.
4. Add a safe, explicit migration/export/import flow when switching storage providers.
5. Add household roles/sharing only with explicit authorization rules and profile-level permission design.
6. Add tests for calculation helpers and Firebase rules alongside each new module.
