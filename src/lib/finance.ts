export type TransactionKind = "income" | "expense";

export type FinanceTransaction = {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  kind: TransactionKind;
};

export type FinanceAsset = {
  id: string;
  name: string;
  detail: string;
  value: number;
  change: number;
  kind: "Property" | "Investments" | "Shares" | "Cash";
  icon: string;
};

export type FinanceBudget = {
  category: string;
  spent: number;
  limit: number;
  color: string;
  group?: string;
  allocationPercent?: number;
};

export type BudgetPlanCategory = {
  category: string;
  group: string;
  allocationPercent: number;
  color: string;
};

export type BudgetPlan = {
  id: string;
  name: string;
  startMonth: string;
  durationMonths: number;
  monthlyIncome: number;
  categories: BudgetPlanCategory[];
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  targetYears: number;
  planType?: "savings" | "fire";
  postFiYears?: number;
  postFiAnnualReturn?: number;
  withdrawalRate?: number;
};

export type FinanceProfile = {
  id: string;
  name: string;
  relation: string;
  initials: string;
  color: string;
  currency: string;
  monthlyIncome: number;
  retirementSavings: number;
  currentAge: number;
  retirementAge: number;
  retirementAnnualReturn: number;
  retirementContributionRate: number;
  transactions: FinanceTransaction[];
  assets: FinanceAsset[];
  budgets: FinanceBudget[];
  goals: SavingsGoal[];
  budgetPlans: BudgetPlan[];
};

const dateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export function createDemoProfiles(): FinanceProfile[] {
  return [
    {
      id: "alex",
      name: "Alex Morgan",
      relation: "My finances",
      initials: "AM",
      color: "#5968d9",
      currency: "USD",
      monthlyIncome: 8650,
      retirementSavings: 186400,
      currentAge: 36,
      retirementAge: 65,
      retirementAnnualReturn: 6,
      retirementContributionRate: 12,
      goals: [],
      budgetPlans: [],
      transactions: [
        { id: "t1", title: "Northstar Studio", category: "Salary", date: dateDaysAgo(1), amount: 8650, kind: "income" },
        { id: "t2", title: "Monthly rent", category: "Housing", date: dateDaysAgo(2), amount: 2180, kind: "expense" },
        { id: "t3", title: "Whole Foods Market", category: "Groceries", date: dateDaysAgo(3), amount: 142.6, kind: "expense" },
        { id: "t4", title: "City utilities", category: "Utilities", date: dateDaysAgo(5), amount: 186.4, kind: "expense" },
        { id: "t5", title: "Metro pass", category: "Transport", date: dateDaysAgo(7), amount: 94, kind: "expense" },
        { id: "t6", title: "Dinner at Lilia", category: "Dining", date: dateDaysAgo(8), amount: 128, kind: "expense" },
        { id: "t7", title: "Index fund contribution", category: "Investing", date: dateDaysAgo(10), amount: 750, kind: "expense" },
      ],
      assets: [
        { id: "a1", name: "Maplewood home", detail: "Property · Primary residence", value: 482000, change: 5.2, kind: "Property", icon: "home" },
        { id: "a2", name: "Vanguard portfolio", detail: "Investments · Brokerage", value: 68420, change: 8.4, kind: "Investments", icon: "chart" },
        { id: "a3", name: "Fidelity 401(k)", detail: "Retirement · 401(k)", value: 186400, change: 6.8, kind: "Investments", icon: "briefcase" },
        { id: "a4", name: "Everyday accounts", detail: "Cash · 2 accounts", value: 18760, change: 0.4, kind: "Cash", icon: "wallet" },
      ],
      budgets: [
        { category: "Housing", spent: 2180, limit: 2600, color: "#7a83e6" },
        { category: "Food & dining", spent: 824, limit: 1200, color: "#e5aa68" },
        { category: "Transportation", spent: 394, limit: 600, color: "#6fb5a4" },
        { category: "Shopping", spent: 568, limit: 800, color: "#e78c92" },
      ],
    },
    {
      id: "jamie",
      name: "Jamie Morgan",
      relation: "Partner",
      initials: "JM",
      color: "#db9873",
      currency: "USD",
      monthlyIncome: 7200,
      retirementSavings: 124800,
      currentAge: 35,
      retirementAge: 64,
      retirementAnnualReturn: 6,
      retirementContributionRate: 12,
      goals: [],
      budgetPlans: [],
      transactions: [
        { id: "j1", title: "Greenleaf Design", category: "Salary", date: dateDaysAgo(1), amount: 7200, kind: "income" },
        { id: "j2", title: "Mortgage contribution", category: "Housing", date: dateDaysAgo(2), amount: 1600, kind: "expense" },
        { id: "j3", title: "Trader Joe's", category: "Groceries", date: dateDaysAgo(4), amount: 96.2, kind: "expense" },
      ],
      assets: [
        { id: "ja1", name: "Maplewood home", detail: "Property · Shared residence", value: 241000, change: 5.2, kind: "Property", icon: "home" },
        { id: "ja2", name: "Fidelity 401(k)", detail: "Retirement · 401(k)", value: 124800, change: 7.1, kind: "Investments", icon: "briefcase" },
        { id: "ja3", name: "Roth IRA", detail: "Investments · Retirement", value: 38200, change: 8.7, kind: "Investments", icon: "chart" },
        { id: "ja4", name: "Everyday accounts", detail: "Cash · 2 accounts", value: 12140, change: 0.3, kind: "Cash", icon: "wallet" },
      ],
      budgets: [
        { category: "Housing", spent: 1600, limit: 1900, color: "#7a83e6" },
        { category: "Food & dining", spent: 492, limit: 800, color: "#e5aa68" },
        { category: "Transportation", spent: 215, limit: 400, color: "#6fb5a4" },
        { category: "Shopping", spent: 305, limit: 550, color: "#e78c92" },
      ],
    },
  ];
}

const currencyLocales: Record<string, string> = {
  MYR: "en-MY",
  SGD: "en-SG",
  AUD: "en-AU",
  GBP: "en-GB",
  EUR: "en-IE",
  CAD: "en-CA",
  INR: "en-IN",
  IDR: "id-ID",
};

export function currency(value: number, currencyCode = "USD", compact = false) {
  return new Intl.NumberFormat(currencyLocales[currencyCode] ?? "en-US", {
    style: "currency",
    currency: currencyCode,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function currencySymbol(currencyCode = "USD") {
  return new Intl.NumberFormat(currencyLocales[currencyCode] ?? "en-US", {
    style: "currency",
    currency: currencyCode,
  }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currencyCode;
}

export function futureValue(
  initialAmount: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number,
) {
  const months = Math.max(0, Math.round(years * 12));
  const annualRate = annualReturnPercent / 100;
  if (annualRate <= -1) return months === 0 ? initialAmount : Math.max(0, monthlyContribution);
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  if (Math.abs(monthlyRate) < 1e-10) return initialAmount + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return initialAmount * growth + monthlyContribution * ((growth - 1) / monthlyRate);
}

export function savingsProjection(
  initialAmount: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number,
) {
  return Array.from({ length: Math.max(0, Math.floor(years)) + 1 }, (_, year) => ({
    year,
    balance: futureValue(initialAmount, monthlyContribution, annualReturnPercent, year),
    contributions: initialAmount + monthlyContribution * 12 * year,
  }));
}

export function requiredMonthlyContribution(
  targetAmount: number,
  initialAmount: number,
  annualReturnPercent: number,
  years: number,
) {
  const months = Math.max(0, Math.round(years * 12));
  if (months === 0) return Math.max(0, targetAmount - initialAmount);
  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
  if (Math.abs(monthlyRate) < 1e-10) {
    return Math.max(0, targetAmount - initialAmount) / months;
  }
  const growth = Math.pow(1 + monthlyRate, months);
  return Math.max(0, (targetAmount - initialAmount * growth) * monthlyRate / (growth - 1));
}

export type FireProjectionRow = {
  year: number;
  phase: "Accumulation" | "Financial independence";
  balance: number;
  annualWithdrawal: number;
};

export function fireProjection(goal: SavingsGoal): FireProjectionRow[] {
  const accumulationYears = Math.max(1, Math.min(50, Math.round(goal.targetYears)));
  const postFiYears = Math.max(1, Math.min(60, Math.round(goal.postFiYears ?? 30)));
  const accumulationRows = savingsProjection(
    goal.currentAmount,
    goal.monthlyContribution,
    goal.annualReturn,
    accumulationYears,
  );
  const fiBalance = accumulationRows[accumulationYears]?.balance ?? goal.currentAmount;
  const annualWithdrawal = fiBalance * (goal.withdrawalRate ?? 4) / 100;
  const rows: FireProjectionRow[] = accumulationRows.map((row) => ({
    year: row.year,
    phase: "Accumulation",
    balance: row.balance,
    annualWithdrawal: 0,
  }));
  let balance = fiBalance;

  for (let year = 1; year <= postFiYears; year += 1) {
    balance = Math.max(0, balance * (1 + (goal.postFiAnnualReturn ?? 1) / 100) - annualWithdrawal);
    rows.push({
      year: accumulationYears + year,
      phase: "Financial independence",
      balance,
      annualWithdrawal: Math.min(annualWithdrawal, fiBalance),
    });
  }

  return rows;
}

export type LoanProjection = {
  months: number;
  totalInterest: number;
  totalPaid: number;
  yearlyBalances: { year: number; balance: number; interestPaid: number }[];
  canPayOff: boolean;
};

export function loanProjection(
  principal: number,
  annualInterestPercent: number,
  monthlyPayment: number,
  extraMonthlyPayment = 0,
): LoanProjection {
  let balance = Math.max(0, principal);
  let totalInterest = 0;
  let totalPaid = 0;
  let yearlyInterest = 0;
  const yearlyBalances = [{ year: 0, balance, interestPaid: 0 }];
  const monthlyRate = annualInterestPercent / 1200;
  const payment = monthlyPayment + extraMonthlyPayment;
  if (balance === 0) return { months: 0, totalInterest: 0, totalPaid: 0, yearlyBalances, canPayOff: true };
  if (payment <= balance * monthlyRate) {
    return { months: 0, totalInterest: 0, totalPaid: 0, yearlyBalances, canPayOff: false };
  }
  for (let month = 1; balance > 0.005 && month <= 1200; month += 1) {
    const interest = balance * monthlyRate;
    const paid = Math.min(balance + interest, payment);
    balance = Math.max(0, balance + interest - paid);
    totalInterest += interest;
    yearlyInterest += interest;
    totalPaid += paid;
    if (month % 12 === 0 || balance === 0) {
      yearlyBalances.push({ year: Math.ceil(month / 12), balance, interestPaid: yearlyInterest });
      yearlyInterest = 0;
    }
    if (balance === 0) {
      return { months: month, totalInterest, totalPaid, yearlyBalances, canPayOff: true };
    }
  }
  return { months: 0, totalInterest, totalPaid, yearlyBalances, canPayOff: false };
}

export function totalAssets(profile: FinanceProfile) {
  return profile.assets.reduce((total, asset) => total + asset.value, 0);
}

export function monthToDate(profile: FinanceProfile, kind: TransactionKind) {
  const now = new Date();
  return profile.transactions
    .filter((transaction) => {
      const date = new Date(`${transaction.date}T12:00:00`);
      return transaction.kind === kind && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function createProfile(name: string): FinanceProfile {
  const normalized = name.trim();
  const initials = normalized
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `profile-${Date.now()}`;
  return {
    id,
    name: normalized,
    relation: "Family member",
    initials: initials || "FM",
    color: "#7d8cce",
    currency: "USD",
    monthlyIncome: 0,
    retirementSavings: 0,
    currentAge: 34,
    retirementAge: 65,
    retirementAnnualReturn: 6,
    retirementContributionRate: 12,
    transactions: [],
    assets: [],
    goals: [],
    budgetPlans: [],
    budgets: [
      { category: "Housing", spent: 0, limit: 0, color: "#7a83e6" },
      { category: "Food & dining", spent: 0, limit: 0, color: "#e5aa68" },
      { category: "Transportation", spent: 0, limit: 0, color: "#6fb5a4" },
      { category: "Shopping", spent: 0, limit: 0, color: "#e78c92" },
    ],
  };
}
