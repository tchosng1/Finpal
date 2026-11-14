import { getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  getDocsFromServer,
  getFirestore,
  setDoc,
  doc,
} from "firebase/firestore";
import type { FinanceProfile } from "@/lib/finance";
import { firebaseConfig } from "@/lib/firebase-config";

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export function getFirebaseApp() {
  if (!firebaseConfigured) throw new Error("Firebase is not configured.");
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getAuthClient() {
  return firebaseConfigured && typeof window !== "undefined" ? getAuth(getFirebaseApp()) : null;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getAuthClient();
  if (!auth) throw new Error("Google sign-in is unavailable until Firebase is configured.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithMicrosoft(): Promise<User> {
  const auth = getAuthClient();
  if (!auth) throw new Error("Microsoft sign-in is unavailable until Firebase is configured.");
  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getAuthClient();
  if (!auth) throw new Error("Email sign-in is unavailable until Firebase is configured.");
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function createEmailAccount(email: string, password: string): Promise<User> {
  const auth = getAuthClient();
  if (!auth) throw new Error("Email sign-in is unavailable until Firebase is configured.");
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(user);
  return user;
}

export async function sendPasswordReset(email: string) {
  const auth = getAuthClient();
  if (!auth) throw new Error("Password reset is unavailable until Firebase is configured.");
  await sendPasswordResetEmail(auth, email);
}

export async function linkGoogleAccount() {
  const auth = getAuthClient();
  if (!auth?.currentUser) throw new Error("Sign in before linking another provider.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return (await linkWithPopup(auth.currentUser, provider)).user;
}

export async function linkMicrosoftAccount() {
  const auth = getAuthClient();
  if (!auth?.currentUser) throw new Error("Sign in before linking another provider.");
  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  return (await linkWithPopup(auth.currentUser, provider)).user;
}

export async function signOutFromGoogle() {
  const auth = getAuthClient();
  if (!auth) throw new Error("Firebase is not configured.");
  await signOut(auth);
}

export async function loadProfiles(uid: string): Promise<FinanceProfile[]> {
  const snapshot = await getDocsFromServer(collection(getFirestore(getFirebaseApp()), "users", uid, "profiles"));
  const cloudProfiles = snapshot.docs.map((profileDoc) => {
    const data = profileDoc.data() as Partial<FinanceProfile>;
    return {
      ...data,
      id: profileDoc.id,
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
  if (cloudProfiles.length > 0 || typeof window === "undefined") return cloudProfiles;

  const legacyKey = `finpal-user-profiles:${uid}`;
  const stored = window.localStorage.getItem(legacyKey);
  if (!stored) return cloudProfiles;
  const legacyProfiles: unknown = JSON.parse(stored);
  if (!Array.isArray(legacyProfiles)) {
    throw new Error("Previously saved local finance profiles are not in the expected format; they were left unchanged.");
  }
  const migratedProfiles = legacyProfiles as FinanceProfile[];
  await Promise.all(migratedProfiles.map((profile) => saveProfile(uid, {
    ...profile,
    goals: profile.goals ?? [],
    budgetPlans: profile.budgetPlans ?? [],
  })));
  window.localStorage.removeItem(legacyKey);
  return migratedProfiles;
}

export async function saveProfile(uid: string, profile: FinanceProfile) {
  await setDoc(doc(getFirestore(getFirebaseApp()), "users", uid, "profiles", profile.id), profile);
}

export async function saveProfiles(uid: string, profiles: FinanceProfile[]) {
  await Promise.all(profiles.map((profile) => saveProfile(uid, profile)));
}
