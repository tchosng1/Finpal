"use client";

import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Database,
  FileChartColumnIncreasing,
  HardDrive,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  PiggyBank,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  House,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  createDemoProfiles,
  createProfile,
  currency,
  currencySymbol,
  futureValue,
  monthToDate,
  totalAssets,
  type BudgetPlan,
  type FinanceAsset,
  type FinanceProfile,
  type FinanceTransaction,
  type SavingsGoal,
} from "@/lib/finance";
import { FinanceTools } from "@/components/finance-tools";
import { BudgetPlanner } from "@/components/budget-planner";
import {
  firebaseConfigured,
  createEmailAccount,
  getAuthClient,
  linkGoogleAccount,
  linkMicrosoftAccount,
  signInWithGoogle,
  signInWithEmail,
  signInWithMicrosoft,
  sendPasswordReset,
  signOutFromGoogle,
} from "@/lib/firebase";
import {
  connectGoogleDrive,
  connectOneDrive,
  getStorageErrorMessage,
  loadStoredProfiles,
  saveStoredProfiles,
  type StorageProvider,
} from "@/lib/storage";
import { onAuthStateChanged, type User } from "firebase/auth";

type Section = "Overview" | "Activity" | "Budgets" | "Assets" | "Forecast" | "Retirement" | "Saving planner" | "Investment planner" | "Home loan planner" | "Goals" | "Settings";
type Modal = "profile" | "transaction" | "asset" | "budget" | null;
type ModalEdit =
  | { kind: "profile"; record: FinanceProfile }
  | { kind: "transaction"; record: FinanceTransaction }
  | { kind: "asset"; record: FinanceAsset };
const sections: { name: Section; icon: typeof LayoutDashboard; label?: string }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Activity", icon: CreditCard, label: "Activity" },
  { name: "Budgets", icon: ChartNoAxesCombined },
  { name: "Assets", icon: Landmark },
  { name: "Forecast", icon: TrendingUp },
  { name: "Retirement", icon: BriefcaseBusiness },
];
const toolSections: { name: Extract<Section, "Saving planner" | "Investment planner" | "Home loan planner" | "Goals" | "Settings">; icon: typeof LayoutDashboard }[] = [
  { name: "Saving planner", icon: PiggyBank },
  { name: "Investment planner", icon: ChartNoAxesCombined },
  { name: "Home loan planner", icon: House },
  { name: "Goals", icon: Target },
  { name: "Settings", icon: Settings2 },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getSignInErrorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "auth/operation-not-allowed") {
    return "This sign-in provider is not enabled in Firebase Authentication. Ask the Finpal project administrator to enable it.";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists for this email with another sign-in method. Sign in with that method first, then link the additional provider in Settings.";
  }
  if (code === "auth/email-already-in-use") {
    return "An account already uses this email. Sign in instead, or use the existing provider and link sign-in methods from Settings.";
  }
  if (code === "auth/weak-password") {
    return "Choose a password with at least 6 characters.";
  }
  if (code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
    return "The email or password is not correct.";
  }
  if (code === "auth/configuration-not-found") {
    return "Firebase Authentication has no active sign-in configuration for project finpal-2947c. In Firebase Console, confirm you selected finpal-2947c, open Authentication → Sign-in method, enable Google, and save. Also confirm Authentication has been initialized for this project.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Firebase rejected this app's web address. In Firebase Console for finpal-2947c, open Authentication → Settings → Authorized domains and add localhost (or 127.0.0.1 if you opened that address).";
  }
  return error instanceof Error ? error.message : "Sign-in failed. Please try again.";
}

function Avatar({ profile, size = "normal" }: { profile: Pick<FinanceProfile, "initials" | "color">; size?: "normal" | "small" }) {
  return <span className={`avatar ${size === "small" ? "avatar-small" : ""}`} style={{ backgroundColor: profile.color }}>{profile.initials}</span>;
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><span /><span /><span /></span>
      <span>finpal<span className="brand-period">.</span></span>
    </div>
  );
}

function WealthChart({ compact = false, currencyCode = "USD" }: { compact?: boolean; currencyCode?: string }) {
  const axis = (value: number) => currency(value, currencyCode, true);
  return (
    <div className={`wealth-chart ${compact ? "wealth-chart-compact" : ""}`}>
      <div className="chart-grid">
        <span className="chart-value">{axis(600000)}</span><span className="chart-value">{axis(450000)}</span>
        <span className="chart-value">{axis(300000)}</span><span className="chart-value">{axis(150000)}</span>
      </div>
      <svg viewBox="0 0 760 220" preserveAspectRatio="none" role="img" aria-label="Net worth trend over the last twelve months">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#727ce0" stopOpacity=".19" />
            <stop offset="100%" stopColor="#727ce0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 184 C42 178 48 165 82 169 S132 152 165 157 S214 142 246 145 S292 120 328 130 S375 105 410 114 S462 96 492 101 S540 80 574 85 S616 67 648 77 S702 46 760 38 L760 220 L0 220 Z" fill="url(#chartFill)" />
        <path d="M0 184 C42 178 48 165 82 169 S132 152 165 157 S214 142 246 145 S292 120 328 130 S375 105 410 114 S462 96 492 101 S540 80 574 85 S616 67 648 77 S702 46 760 38" fill="none" stroke="#6874d8" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <circle cx="760" cy="38" r="5" fill="#6874d8" stroke="white" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="chart-months">{monthLabels.map((month) => <span key={month}>{month}</span>)}</div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${dateString}T12:00:00`));
}

function getStoredDemoProfiles(): FinanceProfile[] {
  const stored = localStorage.getItem("finpal-demo-profiles");
  if (!stored) return [];
  try {
    const profiles = JSON.parse(stored) as FinanceProfile[];
    return Array.isArray(profiles) ? profiles.map((profile) => ({
      ...profile,
      goals: profile.goals ?? [],
      budgetPlans: profile.budgetPlans ?? [],
    })) : [];
  } catch {
    localStorage.removeItem("finpal-demo-profiles");
    return [];
  }
}

function FinanceModal({
  modal,
  editing,
  onClose,
  onSaveProfile,
  onSaveTransaction,
  onSaveAsset,
  onUpdateBudget,
  currencyCode,
  categories,
}: {
  modal: Exclude<Modal, null>;
  editing: ModalEdit | null;
  onClose: () => void;
  onSaveProfile: (name: string, id?: string) => void;
  onSaveTransaction: (transaction: Omit<FinanceTransaction, "id">, id?: string) => void;
  onSaveAsset: (asset: Omit<FinanceAsset, "id">, id?: string) => void;
  onUpdateBudget: (category: string, limit: number) => void;
  currencyCode: string;
  categories: string[];
}) {
  const editedProfile = editing?.kind === "profile" ? editing.record : null;
  const editedTransaction = editing?.kind === "transaction" ? editing.record : null;
  const editedAsset = editing?.kind === "asset" ? editing.record : null;
  const [name, setName] = useState(editedProfile?.name ?? "");
  const [title, setTitle] = useState(editedTransaction?.title ?? editedAsset?.name ?? "");
  const [amount, setAmount] = useState(editedTransaction?.amount.toString() ?? editedAsset?.value.toString() ?? "");
  const [kind, setKind] = useState<"income" | "expense">(editedTransaction?.kind ?? "expense");
  const [category, setCategory] = useState(editedTransaction?.category ?? categories[0] ?? "Other");
  const [date, setDate] = useState(editedTransaction?.date ?? new Date().toISOString().slice(0, 10));
  const [assetKind, setAssetKind] = useState<FinanceAsset["kind"]>(editedAsset?.kind ?? "Investments");
  const [assetDetail, setAssetDetail] = useState(editedAsset?.detail ?? "Investments · Added manually");
  const [assetChange, setAssetChange] = useState(editedAsset?.change.toString() ?? "0");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetCategory, setBudgetCategory] = useState(categories[0] ?? "Housing");

  const titles = {
    profile: editedProfile ? "Edit profile" : "Add a person",
    transaction: editedTransaction ? "Edit transaction" : "Add a transaction",
    asset: editedAsset ? "Edit asset" : "Add an asset",
    budget: "Update a budget",
  };
  const descriptions = {
    profile: editedProfile ? "Update this person’s finance profile." : "Create a separate, private space for another person.",
    transaction: "Keep your money picture up to date.",
    asset: "Add a property, investment, or account to your balance sheet.",
    budget: "Set a monthly spending target for a category.",
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal === "profile") onSaveProfile(name, editedProfile?.id);
    if (modal === "transaction") {
      onSaveTransaction({ title, amount: Number(amount), kind, category, date }, editedTransaction?.id);
    }
    if (modal === "asset") {
      onSaveAsset({
        name: title,
        detail: assetDetail.trim() || `${assetKind} · Added manually`,
        value: Number(amount),
        change: Number(assetChange) || 0,
        kind: assetKind,
        icon: assetKind === "Property" ? "home" : assetKind === "Cash" ? "wallet" : "chart",
      }, editedAsset?.id);
    }
    if (modal === "budget") onUpdateBudget(budgetCategory, Number(budgetLimit));
    onClose();
  }

  const needsAmount = modal === "transaction" || modal === "asset";

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        <div className="modal-icon"><Plus size={19} /></div>
        <h2 id="modal-title">{titles[modal]}</h2>
        <p>{descriptions[modal]}</p>
        <form onSubmit={submit} className="modal-form">
          {modal === "profile" && (
            <label>Full name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Taylor Morgan" /></label>
          )}
          {modal === "transaction" && (
            <>
              <div className="segmented-control">
                <button type="button" className={kind === "expense" ? "selected" : ""} onClick={() => setKind("expense")}>Expense</button>
                <button type="button" className={kind === "income" ? "selected" : ""} onClick={() => setKind("income")}>Income</button>
              </div>
              <label>Description<input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Monthly groceries" /></label>
              <label>Amount ({currencyCode})<input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
              <div className="form-row">
                <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{Array.from(new Set([...categories, category])).map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              </div>
            </>
          )}
          {modal === "asset" && (
            <>
              <label>Asset name<input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Brokerage account" /></label>
              <div className="form-row">
                <label>Asset type<select value={assetKind} onChange={(event) => setAssetKind(event.target.value as FinanceAsset["kind"])}><option>Investments</option><option>Property</option><option>Shares</option><option>Cash</option></select></label>
                <label>Current value ({currencyCode})<input required min="0" step="1" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label>
              </div>
              <label>Details<input value={assetDetail} onChange={(event) => setAssetDetail(event.target.value)} placeholder="e.g. Brokerage account" /></label>
              <label>Annual change<input type="number" step="0.1" value={assetChange} onChange={(event) => setAssetChange(event.target.value)} /></label>
            </>
          )}
          {modal === "budget" && (
            <>
              <label>Category<select value={budgetCategory} onChange={(event) => setBudgetCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Monthly limit ({currencyCode})<input required min="0" type="number" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} placeholder="0" /></label>
            </>
          )}
          {needsAmount && <p className="form-currency-hint"><ShieldCheck size={14} /> Amounts stay in this profile.</p>}
          <button type="submit" className="primary-button modal-submit">{modal === "profile" ? editedProfile ? "Save profile" : "Create profile" : modal === "transaction" ? "Save transaction" : modal === "asset" ? editedAsset ? "Save asset" : "Add asset" : "Save budget"}<ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}

export default function FinpalApp() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(!firebaseConfigured);
  const [profilesLoadedForUid, setProfilesLoadedForUid] = useState<string | null>(null);
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("firebase");
  const [mode, setMode] = useState<"demo" | "account" | null>(null);
  const [profiles, setProfiles] = useState<FinanceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [section, setSection] = useState<Section>("Overview");
  const [modal, setModal] = useState<Modal>(null);
  const [modalEdit, setModalEdit] = useState<ModalEdit | null>(null);
  const [notice, setNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "saved" | "error">("idle");
  const [profileLoading, setProfileLoading] = useState(false);
  const [authActionBusy, setAuthActionBusy] = useState(false);
  const [emailAuthOpen, setEmailAuthOpen] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<"sign-in" | "create">("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) {
      if (localStorage.getItem("finpal-demo-session") === "true") {
        queueMicrotask(() => {
          const demoProfiles = getStoredDemoProfiles();
          setProfiles(demoProfiles);
          setActiveProfileId(demoProfiles[0]?.id ?? "");
          setMode("demo");
        });
      }
      return;
    }
    const clientAuth = getAuthClient();
    if (!clientAuth) {
      queueMicrotask(() => setAuthChecked(true));
      return;
    }
    return onAuthStateChanged(clientAuth, (user) => {
      setAuthUser(user);
      setProfileLoading(Boolean(user));
      setProfiles([]);
      setActiveProfileId("");
      setProfilesLoadedForUid(null);
      setSyncStatus("idle");
      setAuthError("");
      const savedStorage = user ? localStorage.getItem(`finpal-storage-provider:${user.uid}`) : null;
      const validProviders: StorageProvider[] = ["firebase", "google-drive", "onedrive", "device"];
      setStorageProvider(savedStorage && validProviders.includes(savedStorage as StorageProvider)
        ? savedStorage as StorageProvider
        : "firebase");
      const restoreDemo = !user && localStorage.getItem("finpal-demo-session") === "true";
      setMode(user ? "account" : restoreDemo ? "demo" : null);
      if (restoreDemo) {
        const demoProfiles = getStoredDemoProfiles();
        setProfiles(demoProfiles);
        setActiveProfileId(demoProfiles[0]?.id ?? "");
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!authUser) return;
    let active = true;
    loadStoredProfiles(authUser.uid, storageProvider)
      .then((loadedProfiles) => {
        if (!active) return;
        setProfiles(loadedProfiles);
        setActiveProfileId(loadedProfiles[0]?.id ?? "");
        setProfilesLoadedForUid(authUser.uid);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = getStorageErrorMessage(error);
        setAuthError(`Storage load failed: ${message}`);
        setSyncStatus("error");
      })
      .finally(() => active && setProfileLoading(false));
    return () => { active = false; };
  }, [authUser, profileLoadAttempt, storageProvider]);

  useEffect(() => {
    if (mode === "demo" && profiles.length > 0) {
      localStorage.setItem("finpal-demo-profiles", JSON.stringify(profiles));
    }
  }, [mode, profiles]);

  useEffect(() => {
    if (mode !== "account" || !authUser || profilesLoadedForUid !== authUser.uid) return;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setSyncStatus("syncing");
      return saveStoredProfiles(authUser.uid, storageProvider, profiles);
    })
      .then(() => {
        if (!active) return;
        setSyncStatus("saved");
        setAuthError((current) => current.startsWith("Storage sync failed:") ? "" : current);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Could not sync your profiles.";
        setSyncStatus("error");
        setAuthError(`Storage sync failed: ${message}`);
      });
    return () => { active = false; };
  }, [authUser, mode, profiles, profilesLoadedForUid, storageProvider]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null;
  const monthExpenses = activeProfile ? monthToDate(activeProfile, "expense") : 0;
  const monthIncome = activeProfile ? monthToDate(activeProfile, "income") : 0;
  const netWorth = activeProfile ? totalAssets(activeProfile) : 0;
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)) : 0;

  const startDemo = useCallback(() => {
    const saved = getStoredDemoProfiles();
    const demoProfiles = saved.length ? saved : createDemoProfiles();
    setProfiles(demoProfiles);
    setActiveProfileId(demoProfiles[0].id);
    setMode("demo");
    localStorage.setItem("finpal-demo-session", "true");
    setAuthError("");
  }, []);

  const login = async (provider: "google" | "microsoft") => {
    setAuthActionBusy(true);
    setAuthError("");
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithMicrosoft();
      localStorage.removeItem("finpal-demo-session");
    } catch (error) {
      setAuthError(getSignInErrorMessage(error));
    } finally {
      setAuthActionBusy(false);
    }
  };

  async function submitEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthActionBusy(true);
    setAuthError("");
    try {
      if (emailAuthMode === "create") {
        await createEmailAccount(emailAddress.trim(), emailPassword);
        setNotice("Account created. Check your email to verify your address.");
      } else {
        await signInWithEmail(emailAddress.trim(), emailPassword);
      }
      localStorage.removeItem("finpal-demo-session");
    } catch (error) {
      setAuthError(getSignInErrorMessage(error));
    } finally {
      setAuthActionBusy(false);
    }
  }

  async function requestPasswordReset() {
    setAuthActionBusy(true);
    setAuthError("");
    try {
      await sendPasswordReset(emailAddress.trim());
      setNotice("If an account exists for that email, a password reset message has been sent.");
    } catch (error) {
      setAuthError(getSignInErrorMessage(error));
    } finally {
      setAuthActionBusy(false);
    }
  }

  const logout = async () => {
    if (mode === "account") {
      setAuthActionBusy(true);
      try {
        await signOutFromGoogle();
        localStorage.removeItem("finpal-demo-session");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not sign out.");
      } finally {
        setAuthActionBusy(false);
      }
      return;
    }
    setMode(null);
    localStorage.removeItem("finpal-demo-session");
    setProfiles([]);
    setActiveProfileId("");
    setProfileMenuOpen(false);
    setAuthError("");
  };

  function addProfile(name: string) {
    if (!name.trim()) return;
    const profile = createProfile(name);
    setProfiles((current) => [...current, profile]);
    setActiveProfileId(profile.id);
    setProfileMenuOpen(false);
    setNotice(`${profile.name}'s profile is ready.`);
  }

  function saveProfileName(name: string, id?: string) {
    if (id) {
      const normalized = name.trim();
      const initials = normalized.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase() || "FM";
      setProfiles((current) => current.map((profile) => profile.id === id ? { ...profile, name: normalized, initials } : profile));
      setNotice("Profile updated.");
      return;
    }
    addProfile(name);
  }

  function isCurrentMonth(dateValue: string) {
    const date = new Date(`${dateValue}T12:00:00`);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  function saveTransaction(transaction: Omit<FinanceTransaction, "id">, id?: string) {
    if (!activeProfile) return;
    setProfiles((current) => current.map((profile) => {
      if (profile.id !== activeProfile.id) return profile;
      const previous = id ? profile.transactions.find((item) => item.id === id) : undefined;
      const transactions = previous
        ? profile.transactions.map((item) => item.id === id ? { ...transaction, id } : item)
        : [{ ...transaction, id: crypto.randomUUID() }, ...profile.transactions];
      let monthlyIncome = profile.monthlyIncome;
      if (previous?.kind === "income" && isCurrentMonth(previous.date)) monthlyIncome -= previous.amount;
      if (transaction.kind === "income" && isCurrentMonth(transaction.date)) monthlyIncome += transaction.amount;
      return { ...profile, transactions, monthlyIncome };
    }));
    setNotice(id ? "Transaction updated." : "Transaction saved.");
  }

  function deleteTransaction(id: string) {
    if (!activeProfile) return;
    setProfiles((current) => current.map((profile) => {
      if (profile.id !== activeProfile.id) return profile;
      const transaction = profile.transactions.find((item) => item.id === id);
      const monthlyIncome = transaction?.kind === "income" && isCurrentMonth(transaction.date)
        ? profile.monthlyIncome - transaction.amount
        : profile.monthlyIncome;
      return { ...profile, transactions: profile.transactions.filter((item) => item.id !== id), monthlyIncome };
    }));
    setNotice("Transaction removed.");
  }

  function saveAsset(asset: Omit<FinanceAsset, "id">, id?: string) {
    if (!activeProfile) return;
    setProfiles((current) => current.map((profile) => profile.id === activeProfile.id
      ? {
          ...profile,
          assets: id
            ? profile.assets.map((item) => item.id === id ? { ...asset, id } : item)
            : [{ ...asset, id: crypto.randomUUID() }, ...profile.assets],
        }
      : profile));
    setNotice(id ? "Asset updated." : "Asset added to this profile.");
  }

  function deleteAsset(id: string) {
    if (!activeProfile) return;
    setProfiles((current) => current.map((profile) => profile.id === activeProfile.id
      ? { ...profile, assets: profile.assets.filter((asset) => asset.id !== id) }
      : profile));
    setNotice("Asset removed.");
  }

  function updateBudget(category: string, limit: number) {
    if (!activeProfile) return;
    setProfiles((current) => current.map((profile) => profile.id === activeProfile.id
      ? {
          ...profile,
          budgets: profile.budgets.some((budget) => budget.category === category)
            ? profile.budgets.map((budget) => budget.category === category ? { ...budget, limit } : budget)
            : [...profile.budgets, { category, spent: 0, limit, color: "#7a83e6" }],
        }
      : profile));
    setNotice("Budget updated.");
  }

  function updateActiveProfile(update: Partial<FinanceProfile>) {
    if (!activeProfile) return;
    setProfiles((current) => current.map((profile) => profile.id === activeProfile.id ? { ...profile, ...update } : profile));
  }

  const setRetirementSavings = (value: string) => {
    const amount = Number(value);
    if (!value.trim() || !Number.isFinite(amount) || amount < 0) {
      setNotice("Enter a retirement balance of zero or more.");
      return;
    }
    updateActiveProfile({ retirementSavings: amount });
  };

  const setRetirementAge = (value: string) => {
    const age = Number(value);
    if (!value.trim() || !Number.isInteger(age) || age < 18 || age > 100) {
      setNotice("Enter a retirement age between 18 and 100.");
      return;
    }
    updateActiveProfile({ retirementAge: age });
  };

  const setCurrentAge = (value: string) => {
    const age = Number(value);
    if (!value.trim() || !Number.isInteger(age) || age < 18 || age > 100) {
      setNotice("Enter a current age between 18 and 100.");
      return;
    }
    updateActiveProfile({ currentAge: age });
  };

  const setRetirementReturn = (value: string) => {
    const rate = Number(value);
    if (!value.trim() || !Number.isFinite(rate) || rate <= -100 || rate > 100) {
      setNotice("Enter an annual return greater than -100% and no more than 100%.");
      return;
    }
    updateActiveProfile({ retirementAnnualReturn: rate });
  };

  const setRetirementContributionRate = (value: string) => {
    const rate = Number(value);
    if (!value.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      setNotice("Enter a contribution rate between 0% and 100%.");
      return;
    }
    updateActiveProfile({ retirementContributionRate: rate });
  };

  const setProfileCurrency = (value: string) => {
    updateActiveProfile({ currency: value });
  };

  function saveGoal(goal: Omit<SavingsGoal, "id">, id?: string) {
    if (!activeProfile) return;
    const goalId = id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `goal-${Date.now()}`);
    const goals = activeProfile.goals ?? [];
    updateActiveProfile({
      goals: id
        ? goals.map((item) => item.id === id ? { ...goal, id } : item)
        : [...goals, { ...goal, id: goalId }],
    });
    setNotice(id ? `${goal.name} goal updated.` : `${goal.name} goal saved.`);
  }

  function deleteGoal(goalId: string) {
    if (!activeProfile) return;
    updateActiveProfile({ goals: (activeProfile.goals ?? []).filter((goal) => goal.id !== goalId) });
    setNotice("Savings goal removed.");
  }

  function saveBudgetPlans(plans: BudgetPlan[]) {
    updateActiveProfile({ budgetPlans: plans });
  }

  function openModal(nextModal: Exclude<Modal, null>, editing: ModalEdit | null = null) {
    setModalEdit(editing);
    setModal(nextModal);
  }

  function closeModal() {
    setModal(null);
    setModalEdit(null);
  }

  const categories = useMemo(() => {
    const existing = activeProfile?.budgets.map((budget) => budget.category) ?? [];
    return Array.from(new Set(["Housing", "Food & dining", "Transportation", "Shopping", "Utilities", "Healthcare", "Investing", "Entertainment", "Other", ...existing]));
  }, [activeProfile]);

  function activateStorageProvider(provider: StorageProvider) {
    if (!authUser) return;
    localStorage.setItem(`finpal-storage-provider:${authUser.uid}`, provider);
    setStorageProvider(provider);
    setProfileLoadAttempt((attempt) => attempt + 1);
    setProfiles([]);
    setActiveProfileId("");
    setProfilesLoadedForUid(null);
    setProfileLoading(true);
    setSyncStatus("idle");
    setAuthError("");
  }

  async function connectStorageProvider(provider: "google-drive" | "onedrive") {
    setAuthActionBusy(true);
    setAuthError("");
    try {
      if (provider === "google-drive") await connectGoogleDrive();
      else await connectOneDrive();
      activateStorageProvider(provider);
    } catch (error) {
      setAuthError(`Storage connection failed: ${getStorageErrorMessage(error)}`);
    } finally {
      setAuthActionBusy(false);
    }
  }

  async function linkIdentityProvider(provider: "google" | "microsoft") {
    setAuthActionBusy(true);
    setAuthError("");
    try {
      const user = provider === "google" ? await linkGoogleAccount() : await linkMicrosoftAccount();
      setAuthUser(user);
      setNotice(`${provider === "google" ? "Google" : "Microsoft"} sign-in linked to this Finpal account.`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not link the sign-in provider.");
    } finally {
      setAuthActionBusy(false);
    }
  }

  function retryCloudLoad() {
    setProfileLoading(true);
    setAuthError("");
    setProfileLoadAttempt((attempt) => attempt + 1);
  }

  if (!authChecked) {
    return <main className="loading-screen"><Brand /><span className="loading-dot" /></main>;
  }
  if (mode === "account" && authUser && profileLoading && profilesLoadedForUid !== authUser.uid) {
    return (
      <main className="loading-screen">
        <Brand /><span className="loading-dot" /><span className="loading-copy">Loading profiles from {storageLabel(storageProvider)}…</span>
        {authUser.email && <span className="loading-account">{authUser.email}</span>}
        {notice && <span className="error-message" role="alert">{notice}</span>}
        <button className="soft-button" onClick={logout} disabled={authActionBusy}>{authActionBusy ? "Signing out…" : "Sign out"}</button>
      </main>
    );
  }
  if (mode === "account" && authUser && profilesLoadedForUid !== authUser.uid
    && (authError.startsWith("Storage load failed:") || authError.startsWith("Storage connection failed:"))) {
    return (
      <main className="loading-screen cloud-load-error">
        <Brand />
        <div role="alert">
          <strong>Profiles are not available from the selected storage.</strong>
          {authUser.email && <p className="loading-account">{authUser.email}</p>}
          <p>{authError}</p>
          <p>Changing destinations does not copy or delete your profiles. Your existing data remains in its original storage.</p>
          {notice && <p className="error-message" role="alert">{notice}</p>}
          <div className="storage-fallback-actions">
            <button className="primary-button" onClick={retryCloudLoad}>Retry selected storage</button>
            <button className="soft-button" onClick={() => activateStorageProvider("firebase")}>Use shared Finpal storage</button>
            <button className="soft-button" onClick={() => activateStorageProvider("device")}>Use this device</button>
            <button className="soft-button" onClick={() => void connectStorageProvider("google-drive")}>Connect Google Drive</button>
            <button className="soft-button" onClick={() => void connectStorageProvider("onedrive")}>Connect OneDrive</button>
          </div>
          <button className="soft-button" onClick={logout} disabled={authActionBusy}>{authActionBusy ? "Signing out…" : "Sign out"}</button>
        </div>
      </main>
    );
  }

  if (!mode) {
    return (
      <main className="auth-page">
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-layout">
          <section className="auth-story">
            <Brand />
            <div className="story-copy">
              <span className="eyebrow"><Sparkles size={14} /> A little more clarity, every day</span>
              <h1>Your money.<br /><span>Your whole picture.</span></h1>
              <p>One thoughtful place to make today&apos;s choices and tomorrow&apos;s plans feel a little easier.</p>
              <div className="story-proof">
                <div className="proof-avatars"><Avatar profile={{ initials: "AM", color: "#5968d9" }} /><Avatar profile={{ initials: "JM", color: "#dba27a" }} /><Avatar profile={{ initials: "RK", color: "#6d9d90" }} /></div>
                <span>Made for real life, and all the people in it.</span>
              </div>
            </div>
            <div className="story-footnote"><ShieldCheck size={15} /> Your profiles stay private and separate.</div>
          </section>
          <section className="auth-card-wrap">
            <div className="auth-card">
              <span className="welcome-mark"><LayoutDashboard size={20} /></span>
              <span className="eyebrow">WELCOME TO FINPAL</span>
              <h2>A calmer way to<br />think about money.</h2>
              <p>Sign in to bring your financial life together.</p>
              {firebaseConfigured ? (
                <button className="google-button" onClick={() => login("google")} disabled={authActionBusy}>
                  <GoogleMark />{authActionBusy ? "Connecting..." : "Continue with Google"}
                </button>
              ) : (
                <div className="setup-notice"><ShieldCheck size={17} /><span>The demo works without Firebase. Configure the shared Firebase project to enable account sign-in and storage choices.</span></div>
              )}
              {firebaseConfigured && <button className="microsoft-button" onClick={() => login("microsoft")} disabled={authActionBusy}>
                <span className="microsoft-mark" aria-hidden="true"><i /><i /><i /><i /></span>
                Continue with Microsoft
              </button>}
              {firebaseConfigured && <button className="email-auth-toggle" onClick={() => { setEmailAuthOpen((open) => !open); setAuthError(""); }}>
                {emailAuthOpen ? "Hide email sign-in" : "Continue with email"}
              </button>}
              {emailAuthOpen && firebaseConfigured && <form className="email-auth-form" onSubmit={(event) => void submitEmailAuth(event)}>
                <label htmlFor="auth-email">Email address</label>
                <input id="auth-email" type="email" autoComplete="email" required value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} />
                <label htmlFor="auth-password">Password</label>
                <input id="auth-password" type="password" autoComplete={emailAuthMode === "create" ? "new-password" : "current-password"} minLength={6} required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} />
                <button className="primary-button" type="submit" disabled={authActionBusy}>
                  {authActionBusy ? "Please wait…" : emailAuthMode === "create" ? "Create account" : "Sign in with email"}
                </button>
                <div className="email-auth-actions">
                  <button type="button" onClick={() => { setEmailAuthMode((current) => current === "create" ? "sign-in" : "create"); setAuthError(""); }}>
                    {emailAuthMode === "create" ? "Already have an account? Sign in" : "New to Finpal? Create an account"}
                  </button>
                  {emailAuthMode === "sign-in" && <button type="button" onClick={() => void requestPasswordReset()} disabled={authActionBusy}>Forgot password?</button>}
                </div>
              </form>}
              <div className="auth-divider"><span />or<span /></div>
              <button className="demo-button" onClick={startDemo}>Explore the demo <ArrowRight size={16} /></button>
              {authError && <p className="error-message" role="alert">{authError}</p>}
              <div className="auth-secure"><ShieldCheck size={14} /> Secure sign-in powered by Firebase</div>
            </div>
            <div className="auth-card-bottom">Thoughtful tools for the life you&apos;re building.</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-head"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
        <div className="profile-picker-wrap">
          <button className="profile-picker" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen}>
            {activeProfile ? <Avatar profile={activeProfile} /> : <span className="avatar">?</span>}
            <span className="profile-picker-copy"><span>MANAGING</span><strong>{activeProfile?.name ?? "Choose a profile"}</strong></span>
            <ChevronDown size={16} className={profileMenuOpen ? "rotate-chevron" : ""} />
          </button>
          {profileMenuOpen && (
            <div className="profile-menu">
              {profiles.map((profile) => (
                <button key={profile.id} className={`profile-menu-item ${activeProfile?.id === profile.id ? "profile-current" : ""}`} onClick={() => { setActiveProfileId(profile.id); setProfileMenuOpen(false); }}>
                  <Avatar profile={profile} size="small" /><span><strong>{profile.name}</strong><small>{profile.relation}</small></span>{activeProfile?.id === profile.id && <Check size={15} />}
                </button>
              ))}
              {activeProfile && <button className="profile-add" onClick={() => { openModal("profile", { kind: "profile", record: activeProfile }); setProfileMenuOpen(false); }}><span><Pencil size={15} /></span>Edit current profile</button>}
              <button className="profile-add" onClick={() => { openModal("profile"); setProfileMenuOpen(false); }}><span><Plus size={16} /></span>Add a person</button>
            </div>
          )}
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <span className="nav-caption">YOUR MONEY</span>
          {sections.map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${section === name ? "nav-active" : ""}`} onClick={() => { setSection(name); setMobileNavOpen(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{name}</span>{name === "Activity" && <span className="nav-count">{activeProfile?.transactions.length ?? 0}</span>}
            </button>
          ))}
          <span className="nav-caption nav-caption-planning">TOOLS & PLANNING</span>
          {toolSections.map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${section === name ? "nav-active" : ""}`} onClick={() => { setSection(name); setMobileNavOpen(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{name}</span>
            </button>
          ))}
          <div className="planning-note"><span className="planning-note-icon"><Sparkles size={15} /></span><span><strong>Your next chapter</strong><small>Little steps add up.</small></span><ArrowRight size={14} /></div>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item support-item" onClick={() => setNotice("Your money stays private to your account and its profiles.")}><CircleHelp size={18} /><span>Help & support</span></button>
          <div className="sidebar-user">
            <span className="user-mini" title={authUser?.email ?? "Demo workspace"}>{(authUser?.displayName ?? authUser?.email ?? "Demo User").split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            <span className="user-copy"><strong>{authUser?.displayName ?? authUser?.email ?? "Demo workspace"}</strong><small>{mode === "demo" ? "Preview mode" : authUser?.email}</small></span>
            <button className="icon-button signout-button" onClick={logout} disabled={authActionBusy} aria-label={mode === "demo" ? "Exit demo" : `Sign out${authUser?.email ? ` of ${authUser.email}` : ""}`} title={mode === "demo" ? "Exit demo" : "Sign out"}>
              <LogOut size={16} /><span className="signout-label">{authActionBusy ? "Signing out…" : mode === "demo" ? "Exit demo" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>My finances</span><ChevronRight size={15} /><strong>{section}</strong></div>
          <div className="top-actions">
            <button className="period-button" onClick={() => setNotice("Showing your current year-to-date picture.")}><CalendarDays size={15} /><span>This year</span><ChevronDown size={14} /></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You're all caught up.")}><Bell size={18} /><i /></button>
            <Avatar profile={activeProfile ?? { initials: "?", color: "#8a91a1" }} size="small" />
          </div>
        </header>
        <div className="page-content">
          {authError && <div className="storage-error" role="alert"><ShieldCheck size={16} /><span>{authError}</span>{authError.startsWith("Storage load failed:") && <button onClick={retryCloudLoad}>Retry</button>}{!authError.startsWith("Storage load failed:") && <button onClick={() => setAuthError("")}>Dismiss</button>}</div>}
          {!activeProfile ? (
            <section className="empty-profiles">
              <span className="welcome-mark"><Wallet size={20} /></span>
              <p className="eyebrow">YOUR FINANCIAL HOME</p><h1>Start with a profile</h1>
              <p>Add the first person you&apos;d like to manage. Every person gets their own independent budget, assets, and plans.</p>
              {mode === "account" && authUser && profilesLoadedForUid !== authUser.uid
                ? <button className="primary-button" onClick={retryCloudLoad}>Retry loading cloud profiles</button>
                : <button className="primary-button" onClick={() => openModal("profile")}><Plus size={16} />Create a profile</button>}
            </section>
          ) : (
            <DashboardContent
              key={activeProfile.id}
              section={section}
              profile={activeProfile}
              monthExpenses={monthExpenses}
              monthIncome={monthIncome}
              netWorth={netWorth}
              savingsRate={savingsRate}
              onOpenModal={openModal}
              onSectionChange={setSection}
              onSetRetirementSavings={setRetirementSavings}
              onSetCurrentAge={setCurrentAge}
              onSetRetirementAge={setRetirementAge}
              onSetRetirementReturn={setRetirementReturn}
              onSetRetirementContributionRate={setRetirementContributionRate}
              onSetProfileCurrency={setProfileCurrency}
              storageProvider={storageProvider}
              storageError={authError}
              storageBusy={authActionBusy}
              identityEmail={authUser?.email ?? ""}
              linkedIdentityProviders={authUser?.providerData.map((provider) => provider.providerId) ?? []}
              isAccountMode={mode === "account"}
              onSelectStorage={activateStorageProvider}
              onConnectStorage={connectStorageProvider}
              onLinkIdentity={linkIdentityProvider}
              onSaveGoal={saveGoal}
              onDeleteGoal={deleteGoal}
              onDeleteTransaction={deleteTransaction}
              onDeleteAsset={deleteAsset}
              onSaveBudgetPlans={saveBudgetPlans}
              onNotice={setNotice}
            />
          )}
        </div>
        <footer className="main-footer"><span><ShieldCheck size={14} />{mode === "account" ? syncStatus === "syncing" ? `Syncing to ${storageLabel(storageProvider)}…` : syncStatus === "error" ? "Storage sync needs attention" : syncStatus === "saved" ? `Synced to ${storageLabel(storageProvider)}` : "Private by design" : "Private by design"}</span><span>Money, in perspective <i>·</i> Finpal {new Date().getFullYear()}</span></footer>
      </main>
      {notice && <div className="toast" role="status"><span className="toast-check"><Check size={14} /></span>{notice}<button className="toast-close" onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
      {modal && <FinanceModal
        modal={modal}
        key={`${modal}-${modalEdit?.record.id ?? "new"}`}
        editing={modalEdit}
        onClose={closeModal}
        onSaveProfile={saveProfileName}
        onSaveTransaction={saveTransaction}
        onSaveAsset={saveAsset}
        onUpdateBudget={updateBudget}
        currencyCode={activeProfile?.currency ?? "USD"}
        categories={categories}
      />}
    </div>
  );
}

function storageLabel(provider: StorageProvider) {
  const labels: Record<StorageProvider, string> = {
    firebase: "Finpal cloud",
    "google-drive": "Google Drive",
    onedrive: "OneDrive",
    device: "this device",
  };
  return labels[provider];
}

function GoogleMark() {
  return <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.08-.38-4.55H24v9.02h12.94a11.07 11.07 0 0 1-4.8 7.27l7.72 5.99c4.5-4.16 7.12-10.29 7.12-17.73Z" /><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.73l-7.72-5.99c-2.14 1.43-4.89 2.27-8.18 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" /></svg>;
}

function DashboardContent({
  section,
  profile,
  monthExpenses,
  monthIncome,
  netWorth,
  savingsRate,
  onOpenModal,
  onSectionChange,
  onSetRetirementSavings,
  onSetCurrentAge,
  onSetRetirementAge,
  onSetRetirementReturn,
  onSetRetirementContributionRate,
  onSetProfileCurrency,
  storageProvider,
  storageError,
  storageBusy,
  identityEmail,
  linkedIdentityProviders,
  isAccountMode,
  onSelectStorage,
  onConnectStorage,
  onLinkIdentity,
  onSaveGoal,
  onDeleteGoal,
  onDeleteTransaction,
  onDeleteAsset,
  onSaveBudgetPlans,
  onNotice,
}: {
  section: Section;
  profile: FinanceProfile;
  monthExpenses: number;
  monthIncome: number;
  netWorth: number;
  savingsRate: number;
  onOpenModal: (modal: Exclude<Modal, null>, editing?: ModalEdit | null) => void;
  onSectionChange: (section: Section) => void;
  onSetRetirementSavings: (value: string) => void;
  onSetCurrentAge: (value: string) => void;
  onSetRetirementAge: (value: string) => void;
  onSetRetirementReturn: (value: string) => void;
  onSetRetirementContributionRate: (value: string) => void;
  onSetProfileCurrency: (value: string) => void;
  storageProvider: StorageProvider;
  storageError: string;
  storageBusy: boolean;
  identityEmail: string;
  linkedIdentityProviders: string[];
  isAccountMode: boolean;
  onSelectStorage: (provider: StorageProvider) => void;
  onConnectStorage: (provider: "google-drive" | "onedrive") => Promise<void>;
  onLinkIdentity: (provider: "google" | "microsoft") => Promise<void>;
  onSaveGoal: (goal: Omit<SavingsGoal, "id">, id?: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onSaveBudgetPlans: (plans: BudgetPlan[]) => void;
  onNotice: (message: string) => void;
}) {
  const largestAsset = profile.assets.reduce((largest, asset) => asset.value > largest.value ? asset : largest, { value: 0 } as FinanceAsset);
  const currentAge = profile.currentAge ?? 34;
  const retirementAge = profile.retirementAge ?? 65;
  const retirementAnnualReturn = profile.retirementAnnualReturn ?? 6;
  const retirementContributionRate = profile.retirementContributionRate ?? 12;
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const monthlyRetirementContribution = Math.max(0, profile.monthlyIncome * retirementContributionRate / 100);
  const projectedRetirement = futureValue(profile.retirementSavings, monthlyRetirementContribution, retirementAnnualReturn, yearsToRetirement);

  function money(value: number, compact = false) {
    return currency(value, profile.currency, compact);
  }

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date()).toUpperCase()} <span>·</span> YOUR OVERVIEW</p><h1>{section === "Overview" ? <>A good day to feel <span>in control.</span></> : section}</h1><p className="heading-subtitle">{section === "Overview" ? "Here’s how your financial picture is coming together, " + profile.name.split(" ")[0] + "." : sectionSubtitle(section)}</p></div>
        <div className="heading-actions">
          {section === "Assets" && <button className="soft-button" onClick={() => onOpenModal("asset")}><Plus size={16} />Add asset</button>}
          {section === "Budgets" && <button className="soft-button" onClick={() => onOpenModal("budget")}><Plus size={16} />Set a budget</button>}
          {(section === "Overview" || section === "Activity") && <button className="primary-button" onClick={() => onOpenModal("transaction")}><Plus size={16} />Add transaction</button>}
        </div>
      </div>

      {section === "Overview" && (
        <>
          <section className="metric-grid">
            <article className="metric-card net-worth-card">
              <div className="metric-top"><span className="metric-label">TOTAL NET WORTH <span className="info-dot" title="Sum of the assets tracked in this profile">i</span></span><span className="metric-icon purple-icon"><Landmark size={17} /></span></div>
              <div className="metric-value">{money(netWorth, true)}</div>
              <div className="metric-foot"><span className="positive-pill"><ArrowUpRight size={13} /> 6.8%</span><span>vs. last year</span><span className="metric-foot-link" onClick={() => onSectionChange("Assets")}>View assets <ArrowRight size={13} /></span></div>
              <div className="metric-spark"><svg viewBox="0 0 120 34" preserveAspectRatio="none"><path d="M0 28 C14 24 19 29 32 21 S51 25 61 16 S78 20 89 12 S106 14 120 3" fill="none" stroke="#777fe0" strokeWidth="2" /></svg></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-label">INCOME THIS MONTH</span><span className="metric-icon green-icon"><ArrowDownLeft size={17} /></span></div>
              <div className="metric-value">{money(monthIncome)}</div>
              <div className="metric-foot"><span className="positive-pill"><ArrowUpRight size={13} /> 4.2%</span><span>vs. last month</span></div>
              <div className="metric-caption">Looking steady this month</div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-label">SPENDING THIS MONTH</span><span className="metric-icon peach-icon"><ArrowUpRight size={17} /></span></div>
              <div className="metric-value">{money(monthExpenses)}</div>
              <div className="metric-foot"><span className="positive-pill"><ArrowDownRight size={13} /> 2.1%</span><span>vs. last month</span></div>
              <div className="metric-caption">{money(Math.max(0, monthIncome - monthExpenses))} left after expenses</div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-label">SAVINGS RATE <span className="info-dot" title="Income minus spending, as a share of income">i</span></span><span className="metric-icon blue-icon"><BadgeDollarSign size={17} /></span></div>
              <div className="metric-value">{savingsRate}<span className="value-suffix">%</span></div>
              <div className="metric-foot"><span className="positive-pill"><ArrowUpRight size={13} /> 3.4%</span><span>vs. last month</span></div>
              <div className="metric-caption">A lovely little bit of momentum</div>
            </article>
          </section>

          <section className="content-grid overview-grid">
            <article className="panel trend-panel">
              <div className="panel-header"><div><h2>Your net worth</h2><p>A year of small steps adding up</p></div><button className="select-button" onClick={() => onNotice("Showing the last 12 months.")}>12 months <ChevronDown size={14} /></button></div>
              <div className="trend-total">{money(netWorth, true)} <span className="trend-gain"><ArrowUpRight size={14} /> 6.8%</span></div>
              <WealthChart currencyCode={profile.currency} />
              <div className="chart-legend"><span><i className="legend-dot net-dot" />Net worth</span><span><i className="legend-line" />Investments</span><span className="legend-period">Past 12 months</span></div>
            </article>
            <article className="panel budget-panel">
              <div className="panel-header"><div><h2>Monthly budget</h2><p>A little room to breathe</p></div><button className="text-link" onClick={() => onSectionChange("Budgets")}>See all <ArrowRight size={14} /></button></div>
              <div className="budget-summary"><div className="donut-wrap"><svg viewBox="0 0 120 120" className="donut-chart" role="img" aria-label="Budget spending progress"><circle cx="60" cy="60" r="48" fill="none" stroke="#f0f0f4" strokeWidth="12" /><circle cx="60" cy="60" r="48" fill="none" stroke="#777fe0" strokeWidth="12" strokeLinecap="round" strokeDasharray="182 302" transform="rotate(-90 60 60)" /></svg><div className="donut-center"><strong>{Math.round((profile.budgets.reduce((s, b) => s + b.spent, 0) / Math.max(1, profile.budgets.reduce((s, b) => s + b.limit, 0))) * 100)}%</strong><span>used</span></div></div><div className="budget-amount"><strong>{money(profile.budgets.reduce((sum, budget) => sum + budget.spent, 0))}</strong><span>of {money(profile.budgets.reduce((sum, budget) => sum + budget.limit, 0))}</span><small>Monthly spending plan</small></div></div>
              <div className="mini-budget-list">{profile.budgets.slice(0, 3).map((budget) => <div key={budget.category} className="mini-budget-row"><div><span>{budget.category}</span><small>{money(budget.spent)} <i>of</i> {money(budget.limit)}</small></div><span className="mini-progress"><i style={{ width: `${Math.min(100, budget.limit ? budget.spent / budget.limit * 100 : 0)}%`, backgroundColor: budget.color }} /></span></div>)}</div>
              <button className="panel-bottom-link" onClick={() => onSectionChange("Budgets")}>Review your spending plan <ArrowRight size={14} /></button>
            </article>
          </section>

          <section className="content-grid lower-grid">
            <article className="panel transactions-panel">
              <div className="panel-header"><div><h2>Recent activity</h2><p>The little details that shape the big picture</p></div><button className="text-link" onClick={() => onSectionChange("Activity")}>View all <ArrowRight size={14} /></button></div>
              <TransactionList
                transactions={profile.transactions.slice(0, 5)}
                currencyCode={profile.currency}
                onEdit={(transaction) => onOpenModal("transaction", { kind: "transaction", record: transaction })}
                onDelete={(transactionId) => onDeleteTransaction(transactionId)}
              />
            </article>
            <article className="panel assets-panel">
              <div className="panel-header"><div><h2>Your assets</h2><p>What you&apos;re building on</p></div><button className="text-link" onClick={() => onSectionChange("Assets")}>View all <ArrowRight size={14} /></button></div>
              <div className="asset-highlight"><span className="asset-tile"><Home size={18} /></span><span className="asset-highlight-copy"><strong>{largestAsset.name || "Your assets"}</strong><small>{largestAsset.detail || "Add an asset to get started"}</small></span><strong>{money(largestAsset.value, true)}</strong></div>
              <div className="asset-total-row"><span>{profile.assets.length} assets tracked</span><span>Total <strong>{money(netWorth, true)}</strong></span></div>
              <div className="asset-note"><span className="asset-note-icon"><Sparkles size={14} /></span><p>Your money story is more than a number. Keep building it, one piece at a time.</p></div>
            </article>
          </section>
          <section className="insight-strip"><span className="insight-star"><Sparkles size={16} /></span><div><strong>You&apos;re building a nice rhythm.</strong><p>You&apos;ve saved {money(Math.max(0, monthIncome - monthExpenses))} so far this month. Keep it up — consistency matters more than perfection.</p></div><button onClick={() => onSectionChange("Forecast")}>Explore your forecast <ArrowRight size={15} /></button></section>
        </>
      )}

      {section === "Activity" && <section className="panel full-panel"><div className="panel-header"><div><h2>All activity</h2><p>Every inflow and outflow for {profile.name}</p></div><span className="activity-count">{profile.transactions.length} transactions</span></div><TransactionList transactions={profile.transactions} currencyCode={profile.currency} emptyMessage="No transactions yet. Add one to start tracking this profile." onEdit={(transaction) => onOpenModal("transaction", { kind: "transaction", record: transaction })} onDelete={onDeleteTransaction} /></section>}

      {section === "Budgets" && (
        <>
        <section className="budget-page-grid">
          <article className="panel budget-overview-card"><div className="panel-header"><div><h2>This month&apos;s plan</h2><p>Spending with a little more intention</p></div><button className="soft-button small-soft-button" onClick={() => onOpenModal("budget")}><Settings2 size={15} />Edit budgets</button></div>
            <div className="budget-page-total"><div><span>Budgeted</span><strong>{money(profile.budgets.reduce((sum, budget) => sum + budget.limit, 0))}</strong></div><div><span>Spent so far</span><strong>{money(profile.budgets.reduce((sum, budget) => sum + budget.spent, 0))}</strong></div><div><span>Still available</span><strong className="available-value">{money(profile.budgets.reduce((sum, budget) => sum + Math.max(0, budget.limit - budget.spent), 0))}</strong></div></div>
            <div className="large-budget-list">{profile.budgets.map((budget) => <div className="large-budget-row" key={budget.category}><div className="large-budget-label"><span className="budget-color-dot" style={{ background: budget.color }} /><strong>{budget.category}</strong><span>{money(budget.spent)} <i>of</i> {money(budget.limit)}</span><b>{budget.limit ? Math.round(budget.spent / budget.limit * 100) : 0}%</b></div><div className="large-progress"><i style={{ width: `${Math.min(100, budget.limit ? budget.spent / budget.limit * 100 : 0)}%`, background: budget.color }} /></div></div>)}</div>
            <button className="panel-bottom-link" onClick={() => onOpenModal("budget")}><Plus size={15} /> Add another category budget</button>
          </article>
          <aside className="budget-side-column"><article className="panel calm-card"><span className="calm-icon"><Sparkles size={18} /></span><h2>Gentle progress counts.</h2><p>A budget isn&apos;t about saying no to everything. It&apos;s a way to make room for what matters most to you.</p><div className="calm-stat"><span>Your savings rate</span><strong>{savingsRate}%</strong></div></article><article className="panel budget-tip"><span className="tip-label">A SMALL TIP</span><p>Give every dollar a purpose. Start with the things that bring you joy, then plan around them.</p></article></aside>
        </section>
        <BudgetPlanner plans={profile.budgetPlans ?? []} monthlyIncome={profile.monthlyIncome} currencyCode={profile.currency} onSavePlans={onSaveBudgetPlans} />
        </>
      )}

      {section === "Assets" && <section className="asset-page">
        <article className="panel asset-total-card"><div><span className="metric-label">TOTAL ASSETS TRACKED</span><strong>{money(netWorth, true)}</strong><small>Across {profile.assets.length} accounts and properties</small></div><span className="asset-total-icon"><Landmark size={21} /></span></article>
        {profile.assets.length ? <div className="asset-card-grid">{profile.assets.map((asset) => <article className="panel asset-card" key={asset.id}><div className="asset-card-actions"><button className="icon-button" aria-label={`Edit ${asset.name}`} onClick={() => onOpenModal("asset", { kind: "asset", record: asset })}><Pencil size={14} /></button><button className="icon-button" aria-label={`Delete ${asset.name}`} onClick={() => onDeleteAsset(asset.id)}><Trash2 size={14} /></button></div><div className={`asset-kind-icon ${asset.kind.toLowerCase()}`}>{asset.kind === "Property" ? <Home size={18} /> : asset.kind === "Cash" ? <Wallet size={18} /> : asset.kind === "Shares" ? <ChartNoAxesCombined size={18} /> : <BriefcaseBusiness size={18} />}</div><span className="asset-kind-label">{asset.kind}</span><h2>{asset.name}</h2><p>{asset.detail}</p><strong className="asset-card-value">{money(asset.value, true)}</strong><span className={`asset-change ${asset.change < 0 ? "negative" : ""}`}>{asset.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(asset.change).toFixed(1)}% <i>this year</i></span></article>)}</div> : <EmptyState title="Your balance sheet starts here." text="Add a property, investment, or account to see everything you own in one place." action="Add your first asset" onAction={() => onOpenModal("asset")} />}
        <div className="asset-disclaimer"><ShieldCheck size={15} />Values are manually tracked estimates, not live account balances.</div>
      </section>}

      {section === "Forecast" && <>
        <section className="forecast-layout"><article className="panel forecast-panel"><div className="panel-header"><div><h2>Your financial forecast</h2><p>Based on your retirement assumptions and current savings</p></div><button className="text-link" onClick={() => onSectionChange("Retirement")}>Adjust assumptions <ArrowRight size={14} /></button></div><div className="forecast-highlight"><span>Estimated retirement savings at age {retirementAge}</span><strong>{money(projectedRetirement, true)}</strong><small><TrendingUp size={14} /> Assumes {retirementAnnualReturn}% annual return and {retirementContributionRate}% of income contributed monthly</small></div><WealthChart currencyCode={profile.currency} /><div className="forecast-assumption-row"><span><i className="legend-dot net-dot" />Current retirement savings</span><strong>{money(profile.retirementSavings, true)}</strong></div><div className="forecast-assumption-row"><span><i className="legend-dot assumption-dot" />Monthly contribution</span><strong>{money(monthlyRetirementContribution)}</strong></div></article><aside className="panel forecast-note"><span className="calm-icon"><Sparkles size={18} /></span><h2>Planning, not predicting.</h2><p>This is a simple illustration to help you think ahead. Actual returns vary, and life rarely follows a straight line.</p><button className="text-link" onClick={() => onSectionChange("Retirement")}>Explore retirement planning <ArrowRight size={14} /></button></aside></section>
        <BudgetPlanner plans={profile.budgetPlans ?? []} monthlyIncome={profile.monthlyIncome} currencyCode={profile.currency} onSavePlans={onSaveBudgetPlans} />
      </>}

      {section === "Retirement" && (
        <section className="retirement-layout">
          <article className="panel retirement-card">
            <div className="panel-header"><div><h2>A future you&apos;re growing into.</h2><p>Personalize your assumptions for {profile.name}</p></div><span className="retirement-badge"><Sparkles size={14} /> YOUR PLAN</span></div>
            <div className="retirement-projection">
              <span>Potential retirement savings</span><strong>{money(projectedRetirement, true)}</strong><small>By age {retirementAge} · illustrative projection</small>
              <div className="retirement-progress"><i style={{ width: `${Math.min(100, profile.retirementSavings / 1000000 * 100)}%` }} /></div>
              <div className="retirement-progress-labels"><span>Today {money(profile.retirementSavings, true)}</span><span>Illustrative goal {money(1000000, true)}</span></div>
            </div>
            <div className="retirement-inputs">
              <label>Current age<div className="input-with-suffix"><input aria-label="Current age" type="number" min="18" max="100" step="1" defaultValue={currentAge} onBlur={(event) => onSetCurrentAge(event.target.value)} /><span>years old</span></div></label>
              <label>Current retirement savings<div className="input-with-prefix"><span>{currencySymbol(profile.currency)}</span><input aria-label="Current retirement savings" type="number" min="0" step="any" defaultValue={profile.retirementSavings} onBlur={(event) => onSetRetirementSavings(event.target.value)} /></div></label>
              <label>Target retirement age<div className="input-with-suffix"><input aria-label="Target retirement age" type="number" min="18" max="100" step="1" defaultValue={retirementAge} onBlur={(event) => onSetRetirementAge(event.target.value)} /><span>years old</span></div></label>
              <label>Annual return assumption<div className="input-with-suffix"><input aria-label="Annual return assumption" type="number" min="-99.9" max="100" step="0.1" defaultValue={retirementAnnualReturn} onBlur={(event) => onSetRetirementReturn(event.target.value)} /><span>%</span></div></label>
              <label>Income contributed<div className="input-with-suffix"><input aria-label="Income contributed" type="number" min="0" max="100" step="0.1" defaultValue={retirementContributionRate} onBlur={(event) => onSetRetirementContributionRate(event.target.value)} /><span>% / month</span></div></label>
            </div>
            <div className="assumptions-note"><ShieldCheck size={15} /><span>Edit inputs and leave the field to update your saved projection. Returns greater than -100% and up to 100%; contribution rate 0-100%. Not financial advice.</span></div>
          </article>
          <aside className="panel retirement-side"><span className="retirement-illustration"><FileChartColumnIncreasing size={27} /></span><h2>Small steps make a big difference.</h2><p>Adjust savings, contribution, return, or timeline to compare a scenario. Your assumptions save with this profile.</p><div className="retirement-side-row"><span><span className="side-bullet purple-bullet" />Growth assumption</span><strong>{retirementAnnualReturn}% / year</strong></div><div className="retirement-side-row"><span><span className="side-bullet green-bullet" />Monthly contribution</span><strong>{money(monthlyRetirementContribution)}</strong></div></aside>
        </section>
      )}

      {(section === "Saving planner" || section === "Investment planner" || section === "Home loan planner" || section === "Goals") && (
        <FinanceTools
          section={section}
          goals={profile.goals ?? []}
          currencyCode={profile.currency}
          onSaveGoal={onSaveGoal}
          onDeleteGoal={onDeleteGoal}
        />
      )}

      {section === "Settings" && (
        <section className="settings-layout">
          {isAccountMode && <>
          <article className="panel settings-card">
            <div className="panel-header"><div><h2>Sign-in methods</h2><p>Connect identities independently from where your finance data is stored.</p></div><span className="metric-icon purple-icon"><ShieldCheck size={17} /></span></div>
            <p className="settings-hint">{identityEmail ? `Signed in as ${identityEmail}.` : "Signed in to Finpal."} Linking another provider keeps it attached to this Firebase account where provider policies allow it.</p>
            <div className="identity-link-actions">
              {!linkedIdentityProviders.includes("google.com") && <button className="soft-button" onClick={() => void onLinkIdentity("google")} disabled={storageBusy}>Link Google account</button>}
              {!linkedIdentityProviders.includes("microsoft.com") && <button className="soft-button" onClick={() => void onLinkIdentity("microsoft")} disabled={storageBusy}>Link Microsoft account</button>}
            </div>
            <p className="settings-hint">Microsoft sign-in must be enabled in the Finpal Firebase Authentication project. An email provider is for identity; Google Drive or OneDrive access must be connected separately.</p>
          </article>
          <article className="panel settings-card storage-settings-card">
            <div className="panel-header"><div><h2>Data storage</h2><p>Choose where this signed-in account&apos;s profiles are stored.</p></div><span className="metric-icon purple-icon"><Database size={17} /></span></div>
            <p className="settings-hint storage-explanation">Storage is separate from sign-in. Switching storage does not move or delete data; each destination has its own profile list.</p>
            <div className="storage-options" role="group" aria-label="Profile storage provider">
              <button className={`storage-option ${storageProvider === "firebase" ? "storage-option-selected" : ""}`} aria-pressed={storageProvider === "firebase"} onClick={() => onSelectStorage("firebase")}>
                <Database size={18} /><span><strong>Shared Finpal Firebase</strong><small>Private per account, secured by your Firebase UID. Finpal operates this database.</small></span><i>{storageProvider === "firebase" ? "Selected" : "Select"}</i>
              </button>
              <button className={`storage-option ${storageProvider === "google-drive" ? "storage-option-selected" : ""}`} aria-pressed={storageProvider === "google-drive"} onClick={() => void onConnectStorage("google-drive")} disabled={storageBusy}>
                <HardDrive size={18} /><span><strong>Your Google Drive</strong><small>Saved to the hidden Finpal app-data folder in your Drive.</small></span><i>{storageBusy && storageProvider === "google-drive" ? "Connecting…" : storageProvider === "google-drive" ? "Reconnect" : "Connect"}</i>
              </button>
              <button className={`storage-option ${storageProvider === "onedrive" ? "storage-option-selected" : ""}`} aria-pressed={storageProvider === "onedrive"} onClick={() => void onConnectStorage("onedrive")} disabled={storageBusy}>
                <HardDrive size={18} /><span><strong>Your Microsoft OneDrive</strong><small>Saved to the Finpal app folder in your OneDrive.</small></span><i>{storageBusy && storageProvider === "onedrive" ? "Connecting…" : storageProvider === "onedrive" ? "Reconnect" : "Connect"}</i>
              </button>
              <button className={`storage-option ${storageProvider === "device" ? "storage-option-selected" : ""}`} aria-pressed={storageProvider === "device"} onClick={() => onSelectStorage("device")}>
                <HardDrive size={18} /><span><strong>This device only</strong><small>Stored in this browser&apos;s local storage; not synced to your other devices.</small></span><i>{storageProvider === "device" ? "Selected" : "Select"}</i>
              </button>
            </div>
            {storageError.startsWith("Storage connection failed:") && <p className="storage-provider-error" role="alert">{storageError}</p>}
            <p className="settings-hint">Before using Google Drive or OneDrive, complete the provider setup described in the deployment guide. Your data is not automatically copied when you change destinations.</p>
          </article>
          </>}
          <article className="panel settings-card">
            <div className="panel-header"><div><h2>Regional preferences</h2><p>Choose the currency to use across this person&apos;s financial views.</p></div><span className="metric-icon purple-icon"><Settings2 size={17} /></span></div>
            <label className="settings-currency-field" htmlFor="profile-currency"><span>Display currency</span><select id="profile-currency" aria-label="Display currency" value={profile.currency} onChange={(event) => onSetProfileCurrency(event.target.value)}><option value="MYR">Malaysian Ringgit (RM)</option><option value="USD">US Dollar ($)</option><option value="SGD">Singapore Dollar (S$)</option><option value="AUD">Australian Dollar (A$)</option><option value="GBP">British Pound (£)</option><option value="EUR">Euro (€)</option><option value="CAD">Canadian Dollar (CA$)</option><option value="INR">Indian Rupee (₹)</option><option value="IDR">Indonesian Rupiah (Rp)</option></select></label>
            <div className="currency-preview"><span>Preview</span><strong>{money(12345.67)}</strong></div>
            <p className="settings-hint">Currency changes only how amounts are displayed; it does not convert values using exchange rates.</p>
          </article>
        </section>
      )}
    </>
  );
}

function sectionSubtitle(section: Section) {
  const copy: Record<Section, string> = {
    Overview: "Your whole financial picture, at a glance.",
    Activity: "The everyday moments that tell your money story.",
    Budgets: "A thoughtful plan for the things that matter.",
    Assets: "Everything you own, all in one place.",
    Forecast: "A helpful lens on what the future could hold.",
    Retirement: "A long-term plan that feels like yours.",
    "Saving planner": "Explore a steady savings plan with an editable timeline.",
    "Investment planner": "Compare an investment scenario with flexible assumptions.",
    "Home loan planner": "See how extra payments may change the payoff schedule.",
    Goals: "Turn a savings intention into a plan you can follow.",
    Settings: "Choose the display preferences for this profile.",
  };
  return copy[section];
}

function TransactionList({
  transactions,
  currencyCode,
  emptyMessage = "Your recent transactions will appear here.",
  onEdit,
  onDelete,
}: {
  transactions: FinanceTransaction[];
  currencyCode: string;
  emptyMessage?: string;
  onEdit?: (transaction: FinanceTransaction) => void;
  onDelete?: (transactionId: string) => void;
}) {
  if (!transactions.length) return <div className="empty-transactions"><span className="empty-icon"><CreditCard size={19} /></span><p>{emptyMessage}</p></div>;
  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <div className="transaction-row" key={transaction.id}>
          <span className={`transaction-icon ${transaction.kind === "income" ? "transaction-income" : ""}`}>{transaction.kind === "income" ? <ArrowDownLeft size={17} /> : transaction.category === "Housing" ? <Home size={16} /> : transaction.category === "Investing" ? <TrendingUp size={16} /> : transaction.category === "Groceries" ? <Wallet size={16} /> : <CreditCard size={16} />}</span>
          <span className="transaction-copy"><strong>{transaction.title}</strong><small>{transaction.category} <i>·</i> {formatDate(transaction.date)}</small></span>
          <strong className={`transaction-amount ${transaction.kind === "income" ? "income-amount" : ""}`}>{transaction.kind === "income" ? "+" : "−"}{currency(transaction.amount, currencyCode, false)}</strong>
          {(onEdit || onDelete) && <span className="record-actions"><button className="icon-button" aria-label={`Edit ${transaction.title}`} onClick={() => onEdit?.(transaction)}><Pencil size={14} /></button><button className="icon-button" aria-label={`Delete ${transaction.title}`} onClick={() => onDelete?.(transaction.id)}><Trash2 size={14} /></button></span>}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, text, action, onAction }: { title: string; text: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Landmark size={20} /></span><h2>{title}</h2><p>{text}</p><button className="primary-button" onClick={onAction}><Plus size={16} />{action}</button></div>;
}
