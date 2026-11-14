# Firebase deployment and sign-in setup

Finpal uses **Firebase App Hosting** for the public Next.js deployment. App Hosting supports the Next.js server-rendering model directly; this project is not configured as a static export.

Use Node.js 20.19 or newer for local development and deployment builds.

## 1. Create Firebase resources

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. In **Project settings → General**, register a Web app and note its Firebase client configuration.
3. In **Authentication → Sign-in method**, enable **Google** and choose the support email.
4. In **Authentication → Settings → Authorized domains**, add the deployed App Hosting domain and any custom domain.
5. Create a Cloud Firestore database.

## 2. Run locally

The shared Firebase Web app client config is bundled in `src/lib/firebase-config.ts`; no `.env.local` or per-run environment variables are needed:

```powershell
npm install
npm run dev
```

Enable Google under Firebase Authentication → Sign-in method. Create a Cloud Firestore database and deploy the checked-in Firestore rules. In Authentication → Settings → Authorized domains, add `localhost`. Open the app at `http://localhost:3000`; if you use `http://127.0.0.1:3000`, add `127.0.0.1` as an authorized domain as well if the console accepts it. Then use **Continue with Google** locally. Signed-in profile changes sync to the shared Firestore project on local and deployed origins; the footer reports whether a save is in progress, complete, or failed. Profiles left by the earlier local-only account implementation are migrated on first sign-in if Firestore has no profiles for that UID. Demo mode is also available and stays in browser local storage without signing in.

If a cloud read or save fails, the workspace shows the Firestore error instead of silently falling back to device-only storage. Verify the app is using the intended Firebase project, Firestore is enabled, and `firestore.rules` have been deployed.

### Troubleshooting Google sign-in

- `auth/configuration-not-found`: open the Firebase Console and verify the selected project is `finpal-2947c`. Open Authentication → Sign-in method, enable Google, save the provider, and confirm Firebase Authentication has been initialized for this project. This response indicates that the Firebase Auth backend has no active sign-in configuration; it is not proof of a UI or browser problem.
- `auth/unauthorized-domain`: add the exact host from the browser address bar under Authentication → Settings → Authorized domains (`localhost` for `http://localhost:3000`; `127.0.0.1` if using that host).
- `auth/operation-not-allowed`: enable the Google provider and save it under Authentication → Sign-in method.

Firebase Web app settings, including the API key, are public client identifiers. Do not put Firebase Admin SDK service-account credentials or private keys in the client app. To point this app at a different Firebase project, replace the values in `src/lib/firebase-config.ts` and deploy again.

## 3. Deploy Firestore rules

Install and authenticate the Firebase CLI, select the project, and publish the checked-in rules:

```powershell
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

The rules in `firestore.rules` scope profile reads and writes to the authenticated UID. Deploy rules before inviting users. Review any future Firestore collections and add narrowly scoped rules before using them.

## 4. Set up App Hosting

1. Push this project to a GitHub repository.
2. In Firebase Console, open **App Hosting → Get started**, connect the repository, choose the production branch, and set the app root to the repository root.
3. The shared Firebase Web app configuration is already bundled in `src/lib/firebase-config.ts`; no App Hosting environment variables are required for Firebase client setup. Verify the values match the intended Firebase project before rollout.
4. Create the backend in a supported region, then let App Hosting build and roll out the connected branch.
5. Verify the default `*.hosted.app` URL, add it to Authentication’s authorized domains, and test Google sign-in and Firestore sync against the deployed URL.
6. Add a custom domain under **App Hosting → Settings → Domains** if desired.

The Firebase CLI can also create a backend after the project is connected:

```powershell
firebase apphosting:backends:create --project YOUR_FIREBASE_PROJECT_ID --location us-central1
```

App Hosting provisions the required build and runtime infrastructure. Check the Firebase Console for the backend’s rollout state and use its logs if a build fails. The Firebase web API key is not a secret; access control comes from Authentication, Firestore Security Rules, and domain configuration.

## 5. Production checklist

- [ ] Confirm Google provider and support email are configured.
- [ ] Confirm production and custom domains are authorized in Firebase Auth.
- [ ] Deploy and review Firestore rules.
- [ ] Verify `src/lib/firebase-config.ts` points to the shared Finpal Firebase project.
- [ ] Build/roll out from the intended protected branch.
- [ ] Sign in with a Google account and create two profiles on the deployed URL.
- [ ] Add a transaction and asset under one profile, switch profiles, and verify data is isolated.
- [ ] Verify data remains after reload and that a second signed-in user cannot read the first user’s documents.
- [ ] Configure billing alerts, monitoring, and an appropriate privacy notice before public launch.

## Data and privacy notes

Google sign-in verifies a person’s identity; it does not provision a Firebase project or grant access to that person’s personal Google Drive. Each signed-in person’s profiles are stored in the shared Finpal Firebase project under that person’s authenticated UID (`users/{uid}/profiles/{profileId}`), including when the app is running locally. Firestore rules prevent other users from accessing those documents. Demo mode is browser-local and has no authentication. The Firebase project and its billing/data administration belong to the Finpal project owner. This first release does not link bank accounts or import live balances. Do not enter credentials, payment-card details, or other sensitive account secrets in notes or asset names.
