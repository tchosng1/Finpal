# Finpal identity and storage providers

Finpal treats **identity** (who signed in) and **storage** (where profiles are saved) as separate choices. Sign-in supports Google and Microsoft through Firebase Authentication, plus generic email/password accounts for any email address (including Hotmail addresses; this uses a Finpal/Firebase password, not the Microsoft account password). In **Settings → Data storage**, signed-in users can choose among:

| Destination | Data location | Cross-device | Extra setup |
|---|---|---:|---|
| Shared Finpal Firebase | `users/{uid}/profiles/{profileId}` in the Finpal Firestore project | Yes | Firestore database and rules |
| Google Drive | One JSON file in the user's hidden Drive `appDataFolder` | Yes | Google OAuth web client ID and Drive API |
| Microsoft OneDrive | One JSON file in the user's app folder | Yes | Microsoft Entra SPA client ID and delegated Graph permission |
| This device | Browser localStorage, keyed by signed-in Firebase UID | No | None |

The shared Firebase choice works without external Drive/OneDrive configuration and remains available as a fallback. Firebase sign-in is still the identity service for all signed-in storage choices. Google Drive or OneDrive access must be separately authorized by the user. Demo mode is local and does not require signing in.

## Set up the optional personal cloud destinations

OAuth client IDs are public identifiers, not secrets. Add them to `src/lib/storage-config.ts` after creating the corresponding OAuth apps. Do not put client secrets, service-account keys, or refresh tokens in the browser app.

### Google Drive

1. In Google Cloud Console, select/create the project for the Drive connector and enable the **Google Drive API**.
2. Configure the OAuth consent screen and create an OAuth 2.0 **Web application** client.
3. Add the exact local and production app origins to **Authorized JavaScript origins** (for example `http://localhost:3000` and the deployed HTTPS origin).
4. Configure the consent screen for the `https://www.googleapis.com/auth/drive.appdata` scope. Publish/verify the OAuth app as required for the intended audience and Google policy.
5. Set the client ID in `googleDriveClientId` in `src/lib/storage-config.ts`, then deploy.
6. In Finpal Settings, choose **Your Google Drive** and complete Google's consent prompt.

Finpal writes a single `finpal-profiles.json` file in the hidden app-only folder. The Drive access token is kept in memory only and expires; after a page reload or expiration, reconnect in Settings (or from the storage-load error screen) before syncing. Revoking the scope at Google also stops sync.

### Microsoft OneDrive

1. In Microsoft Entra admin center, register an app for accounts that should be supported (personal Microsoft accounts, work/school accounts, or both).
2. Add the deployed app and local origins as **Single-page application** redirect URIs.
3. Add delegated Microsoft Graph permissions `User.Read` and `Files.ReadWrite.AppFolder`; grant consent as required by the tenant.
4. Set the Application (client) ID in `microsoftClientId` in `src/lib/storage-config.ts`, then deploy.
5. In Finpal Settings, choose **Your Microsoft OneDrive** and complete Microsoft's sign-in/consent prompt.

Finpal writes `finpal-profiles.json` to the connected account's OneDrive app folder. MSAL caches provider tokens in session storage and attempts silent renewal; the user may need to reconnect when Microsoft requires interaction or consent again.

## Microsoft as a sign-in identity

To enable **Continue with Microsoft** and account linking:

1. Create/configure a Microsoft Entra app registration and client secret for Firebase's Microsoft provider. The client secret belongs only in Firebase Console, never `storage-config.ts` or source control.
2. In Firebase Console for `finpal-2947c`, enable **Microsoft** under Authentication sign-in providers and configure the Entra client ID/secret.
3. Add Firebase's redirect URI shown in provider setup to the Entra app registration, and ensure the current Finpal domain is an authorized Firebase Auth domain.
4. With an existing Finpal account, use **Settings → Sign-in methods** to link Google or Microsoft to the current Firebase user. If sign-in reports that the email already belongs to another provider, sign in using that existing method first, then link the other provider.

Google and Microsoft identity providers may report different email addresses or change them over time; Firebase UID is the storage owner key for shared Firebase and device-local data. Personal Drive/OneDrive data is tied to the cloud account the user explicitly connects.

To support arbitrary email providers without a dedicated OAuth integration, enable **Email/Password** in Firebase Authentication. Users can register any email address and receive a Firebase email-verification message. Password reset uses Firebase's password reset email. This does not sign the person in to Hotmail/Yahoo/etc.; provider-specific single sign-on requires that provider to be added as an OAuth provider separately.

## Switching and data handling

The selected storage provider is remembered per Firebase UID in this browser. Each provider has its own profile list; switching does **not** copy or delete records in the previous destination. Before changing providers for an account with data, keep the old destination connected and export/backup data as appropriate. Automatic migration and merge between providers are not implemented yet.

If a selected provider is unavailable, the load error screen offers retry, shared Finpal storage, device-only storage, Drive, OneDrive, and sign-out. This does not silently redirect data: the selected provider must successfully load before profiles can be edited. A blank list from a successful provider read is a valid first-use state.
