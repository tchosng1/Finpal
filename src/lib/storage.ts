import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AuthenticationResult,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import {
  type FinanceProfile,
} from "@/lib/finance";
import { loadProfiles, saveProfiles } from "@/lib/firebase";
import { storageConfig } from "@/lib/storage-config";

export type StorageProvider = "firebase" | "google-drive" | "onedrive" | "device";
type GoogleTokenResponse = { access_token: string; expires_in: number; error?: string; error_description?: string };
type GoogleTokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };
type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback: (error: { message?: string }) => void;
      }) => GoogleTokenClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const profileFileName = "finpal-profiles.json";
const googleDriveScope = "https://www.googleapis.com/auth/drive.appdata";
const microsoftScopes = ["User.Read", "Files.ReadWrite.AppFolder"];
let googleAccessToken: string | null = null;
let googleTokenExpiresAt = 0;
let googleScriptPromise: Promise<void> | null = null;
let msalClient: IPublicClientApplication | null = null;
let msalInitialization: Promise<IPublicClientApplication> | null = null;

function normalizeProfiles(profiles: unknown): FinanceProfile[] {
  if (!Array.isArray(profiles)) throw new Error("The selected storage does not contain a valid Finpal profile list.");
  return profiles.map((value) => {
    if (!value || typeof value !== "object" || !("id" in value) || typeof value.id !== "string") {
      throw new Error("The selected storage contains a profile with an invalid format.");
    }
    const data = value as Partial<FinanceProfile>;
    return {
      ...data,
      currency: data.currency ?? "USD",
      retirementAnnualReturn: data.retirementAnnualReturn ?? 6,
      retirementContributionRate: data.retirementContributionRate ?? 12,
      transactions: data.transactions ?? [],
      assets: data.assets ?? [],
      budgets: data.budgets ?? [],
      goals: data.goals ?? [],
      budgetPlans: data.budgetPlans ?? [],
    } as FinanceProfile;
  });
}

function deviceKey(uid: string) {
  return `finpal-device-profiles:${uid}`;
}

function loadDeviceProfiles(uid: string) {
  const stored = window.localStorage.getItem(deviceKey(uid));
  if (!stored) return [];
  return normalizeProfiles(JSON.parse(stored) as unknown);
}

function saveDeviceProfiles(uid: string, profiles: FinanceProfile[]) {
  window.localStorage.setItem(deviceKey(uid), JSON.stringify(profiles));
}

async function loadGoogleScript() {
  if (window.google?.accounts.oauth2) return;
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => window.google?.accounts.oauth2
        ? resolve()
        : reject(new Error("Google Identity Services loaded without an OAuth client."));
      script.onerror = () => reject(new Error("Could not load Google Identity Services."));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      googleScriptPromise = null;
      throw error;
    });
  }
  await googleScriptPromise;
}

export async function connectGoogleDrive() {
  if (!storageConfig.googleDriveClientId) {
    throw new Error("Google Drive is not configured yet. Add the Google OAuth web client ID to src/lib/storage-config.ts and enable the Drive API for that OAuth app.");
  }
  await loadGoogleScript();
  return new Promise<void>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: storageConfig.googleDriveClientId,
      scope: googleDriveScope,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? "Google Drive authorization did not return an access token."));
          return;
        }
        googleAccessToken = response.access_token;
        googleTokenExpiresAt = Date.now() + response.expires_in * 1000;
        resolve();
      },
      error_callback: (error) => reject(new Error(error.message ?? "Google Drive authorization was cancelled.")),
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

function requireGoogleToken() {
  if (!googleAccessToken || Date.now() >= googleTokenExpiresAt - 30_000) {
    googleAccessToken = null;
    throw new Error("Reconnect Google Drive to continue syncing. Google access tokens expire and are kept only in memory.");
  }
  return googleAccessToken;
}

async function googleDriveRequest(path: string, init?: RequestInit) {
  const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireGoogleToken()}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      googleAccessToken = null;
      throw new Error("Google Drive access expired or was revoked. Reconnect Google Drive and retry.");
    }
    throw new Error(`Google Drive request failed (${response.status}): ${body || response.statusText}`);
  }
  return response;
}

async function loadGoogleDriveProfiles() {
  const query = encodeURIComponent(`name='${profileFileName}' and trashed=false`);
  const listResponse = await googleDriveRequest(`/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`);
  const list = await listResponse.json() as { files?: { id: string }[] };
  if (!list.files?.length) return [];
  const fileResponse = await googleDriveRequest(`/files/${encodeURIComponent(list.files[0].id)}?alt=media`);
  return normalizeProfiles(await fileResponse.json() as unknown);
}

async function saveGoogleDriveProfiles(profiles: FinanceProfile[]) {
  const query = encodeURIComponent(`name='${profileFileName}' and trashed=false`);
  const listResponse = await googleDriveRequest(`/files?spaces=appDataFolder&q=${query}&fields=files(id)`);
  const list = await listResponse.json() as { files?: { id: string }[] };
  const boundary = `finpal-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name: profileFileName, ...(list.files?.[0] ? {} : { parents: ["appDataFolder"] }) });
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`,
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(profiles)}`,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  const resource = list.files?.[0]
    ? `/files/${encodeURIComponent(list.files[0].id)}`
    : "/files";
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3${resource}?uploadType=multipart`, {
    method: list.files?.[0] ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${requireGoogleToken()}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 401) {
      googleAccessToken = null;
      throw new Error("Google Drive access expired or was revoked. Reconnect Google Drive and retry.");
    }
    throw new Error(`Google Drive save failed (${response.status}): ${errorBody || response.statusText}`);
  }
}

function getMsalClient() {
  if (!storageConfig.microsoftClientId) {
    throw new Error("OneDrive is not configured yet. Add the Microsoft Entra public client ID to src/lib/storage-config.ts and register this app as a single-page application.");
  }
  if (!msalClient) {
    msalClient = new PublicClientApplication({
      auth: {
        clientId: storageConfig.microsoftClientId,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: typeof window === "undefined" ? undefined : window.location.origin,
      },
      cache: { cacheLocation: "sessionStorage" },
    });
  }
  if (!msalInitialization) {
    msalInitialization = msalClient.initialize().then(() => msalClient!);
  }
  return msalInitialization;
}

async function getMicrosoftToken(client: IPublicClientApplication, result?: AuthenticationResult) {
  const account = result?.account ?? client.getActiveAccount() ?? client.getAllAccounts()[0];
  if (!account) throw new Error("Connect a Microsoft account to use OneDrive storage.");
  client.setActiveAccount(account);
  try {
    return (await client.acquireTokenSilent({ scopes: microsoftScopes, account })).accessToken;
  } catch (error) {
    if (!(error instanceof InteractionRequiredAuthError)) throw error;
    return (await client.acquireTokenPopup({ scopes: microsoftScopes, account })).accessToken;
  }
}

export async function connectOneDrive() {
  const client = await getMsalClient();
  const result = await client.loginPopup({ scopes: microsoftScopes });
  client.setActiveAccount(result.account);
  await getMicrosoftToken(client, result);
}

async function oneDriveRequest(accessToken: string) {
  const path = `/me/drive/special/approot:/${profileFileName}:/content`;
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`OneDrive request failed (${response.status}): ${await response.text()}`);
  return response;
}

async function loadOneDriveProfiles() {
  const client = await getMsalClient();
  const token = await getMicrosoftToken(client);
  const response = await oneDriveRequest(token);
  if (!response) return [];
  return normalizeProfiles(await response.json() as unknown);
}

async function saveOneDriveProfiles(profiles: FinanceProfile[]) {
  const client = await getMsalClient();
  const accessToken = await getMicrosoftToken(client);
  const path = `/me/drive/special/approot:/${profileFileName}:/content`;
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profiles),
  });
  if (!response.ok) throw new Error(`OneDrive save failed (${response.status}): ${await response.text()}`);
}

export async function loadStoredProfiles(uid: string, provider: StorageProvider) {
  if (provider === "firebase") return loadProfiles(uid);
  if (provider === "device") return loadDeviceProfiles(uid);
  if (provider === "google-drive") return loadGoogleDriveProfiles();
  return loadOneDriveProfiles();
}

export async function saveStoredProfiles(uid: string, provider: StorageProvider, profiles: FinanceProfile[]) {
  if (provider === "firebase") return saveProfiles(uid, profiles);
  if (provider === "device") return saveDeviceProfiles(uid, profiles);
  if (provider === "google-drive") return saveGoogleDriveProfiles(profiles);
  return saveOneDriveProfiles(profiles);
}

export function getStorageErrorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "The selected storage could not be reached.";
  if (code === "permission-denied") {
    return "Shared Finpal storage denied this account. Confirm the Firestore database and deployed rules are configured correctly.";
  }
  if (code === "failed-precondition" || code === "not-found") {
    return "Shared Finpal storage is not ready. Confirm the Firestore database exists in the configured Firebase project.";
  }
  if (code === "unavailable" || code === "network-request-failed") {
    return "The selected storage could not be reached. Check the network and retry.";
  }
  return message;
}
