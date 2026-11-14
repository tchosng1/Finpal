"use client";

import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  loanProjection,
  savingsProjection,
  fireProjection,
  currency,
  requiredMonthlyContribution,
  type SavingsGoal,
} from "@/lib/finance";

type ToolSection = "Saving planner" | "Investment planner" | "Home loan planner" | "Goals";

function amount(value: number, currencyCode: string) {
  return currency(value, currencyCode, true);
}

function NumberField({
  label,
  value,
  onChange,
  step = "any",
  min,
  max,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="planner-field">
      <span>{label}</span>
      <span className="planner-input-wrap">
        <input
          aria-label={label}
          inputMode="decimal"
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <i>{suffix}</i>}
      </span>
    </label>
  );
}

function positiveNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function returnNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > -100 && parsed <= 100 ? parsed : fallback;
}

function yearCount(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(50, Math.max(1, Math.round(parsed))) : fallback;
}

function ProjectionChart({ values, currencyCode }: { values: number[]; currencyCode: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="projection-chart" aria-label="Projected balance by year">
      {values.map((value, year) => (
        <div className="projection-chart-column" key={year}>
          <strong>{amount(value, currencyCode)}</strong>
          <span className="projection-chart-track"><i style={{ height: `${Math.max(3, value / max * 100)}%` }} /></span>
          <small>{year === 0 ? "Now" : `Yr ${year}`}</small>
        </div>
      ))}
    </div>
  );
}

function CompoundPlanner({
  section,
  currencyCode,
}: {
  section: Exclude<ToolSection, "Home loan planner" | "Goals">;
  currencyCode: string;
}) {
  const investment = section === "Investment planner";
  const [initial, setInitial] = useState(investment ? "10000" : "0");
  const [monthly, setMonthly] = useState(investment ? "300" : "500");
  const [annualReturn, setAnnualReturn] = useState(investment ? "7" : "3");
  const [years, setYears] = useState("10");
  const initialValue = positiveNumber(initial, 0);
  const monthlyValue = positiveNumber(monthly, 0);
  const returnValue = returnNumber(annualReturn, investment ? 7 : 3);
  const yearsValue = yearCount(years, 10);
  const projection = useMemo(
    () => savingsProjection(initialValue, monthlyValue, returnValue, yearsValue),
    [initialValue, monthlyValue, returnValue, yearsValue],
  );
  const finalBalance = projection[projection.length - 1]?.balance ?? initialValue;
  const totalContributions = initialValue + monthlyValue * yearsValue * 12;

  return (
    <section className="planner-layout">
      <article className="panel planner-main">
        <div className="panel-header"><div><h2>{investment ? "Investment projection" : "Savings projection"}</h2><p>{investment ? "Explore how regular investing may grow over time." : "Build a steady plan toward the things you want."}</p></div><span className="planner-assumption"><Sparkles size={14} />Adjust assumptions below</span></div>
        <div className="planner-fields">
          <NumberField label={investment ? "Starting investment" : "Starting savings"} value={initial} onChange={setInitial} min={0} />
          <NumberField label="Monthly contribution" value={monthly} onChange={setMonthly} min={0} />
          <NumberField label="Annual return" value={annualReturn} onChange={setAnnualReturn} min={-99.9} max={100} suffix="%" step="0.1" />
          <NumberField label="Time horizon" value={years} onChange={setYears} min={1} max={50} suffix="years" step="1" />
        </div>
        <div className="projection-result"><span>Estimated value in {yearsValue} years</span><strong>{amount(finalBalance, currencyCode)}</strong><small>Based on {returnValue}% annual return, compounded monthly. Estimates only.</small></div>
        <ProjectionChart values={projection.map((row) => row.balance)} currencyCode={currencyCode} />
        <div className="projection-table-wrap">
          <table className="projection-table">
            <thead><tr><th>Year</th><th>Amount contributed</th><th>Estimated balance</th><th>Estimated growth</th></tr></thead>
            <tbody>{projection.map((row) => <tr key={row.year}><td>{row.year === 0 ? "Today" : `Year ${row.year}`}</td><td>{amount(row.contributions, currencyCode)}</td><td>{amount(row.balance, currencyCode)}</td><td className="growth-cell">{amount(Math.max(0, row.balance - row.contributions), currencyCode)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="planner-footnote">Total planned contributions: <strong>{amount(totalContributions, currencyCode)}</strong>. Actual returns can vary and may be negative.</div>
      </article>
      <aside className="panel planner-side"><span className="planner-side-icon"><ArrowUpRight size={19} /></span><h2>Make the assumptions yours.</h2><p>Change any input to compare scenarios. This illustration does not include fees, taxes, inflation, or changing contributions.</p><div className="planner-side-stat"><span>Monthly contribution</span><strong>{amount(monthlyValue, currencyCode)}</strong></div><div className="planner-side-stat"><span>Estimated contributions</span><strong>{amount(totalContributions, currencyCode)}</strong></div></aside>
    </section>
  );
}

function HomeLoanPlanner({ currencyCode }: { currencyCode: string }) {
  const [balance, setBalance] = useState("350000");
  const [rate, setRate] = useState("5.5");
  const [payment, setPayment] = useState("2200");
  const [extraPayment, setExtraPayment] = useState("0");
  const loan = positiveNumber(balance, 0);
  const interestRate = Math.min(100, positiveNumber(rate, 0));
  const monthlyPayment = positiveNumber(payment, 0);
  const extra = positiveNumber(extraPayment, 0);
  const standard = useMemo(() => loanProjection(loan, interestRate, monthlyPayment), [loan, interestRate, monthlyPayment]);
  const accelerated = useMemo(() => loanProjection(loan, interestRate, monthlyPayment, extra), [loan, interestRate, monthlyPayment, extra]);
  const years = Math.max(1, Math.min(50, Math.ceil(Math.max(standard.months, accelerated.months) / 12) || 30));
  const yearRows = Array.from({ length: years + 1 }, (_, year) => ({
    year,
    standard: standard.yearlyBalances.find((row) => row.year === year)?.balance ?? (year * 12 >= standard.months && standard.canPayOff ? 0 : undefined),
    accelerated: accelerated.yearlyBalances.find((row) => row.year === year)?.balance ?? (year * 12 >= accelerated.months && accelerated.canPayOff ? 0 : undefined),
  })).filter((row) => row.standard !== undefined || row.accelerated !== undefined);
  const maxLoanBalance = Math.max(1, loan);
  const paidEarlierMonths = standard.canPayOff && accelerated.canPayOff ? standard.months - accelerated.months : 0;
  const interestSaved = standard.canPayOff && accelerated.canPayOff ? Math.max(0, standard.totalInterest - accelerated.totalInterest) : 0;

  return (
    <section className="planner-layout">
      <article className="panel planner-main">
        <div className="panel-header"><div><h2>Home loan payoff planner</h2><p>Compare your current payment with an optional extra monthly payment.</p></div><span className="planner-assumption"><Sparkles size={14} />Illustrative estimate</span></div>
        <div className="planner-fields">
          <NumberField label="Remaining loan balance" value={balance} onChange={setBalance} min={0} />
          <NumberField label="Annual interest rate" value={rate} onChange={setRate} min={0} max={100} suffix="%" step="0.01" />
          <NumberField label="Monthly payment" value={payment} onChange={setPayment} min={0} />
          <NumberField label="Extra monthly payment" value={extraPayment} onChange={setExtraPayment} min={0} />
        </div>
        {!standard.canPayOff && loan > 0 && <div className="planner-warning" role="status">The monthly payment does not cover the estimated interest. Increase the payment to see a payoff schedule.</div>}
        <div className="planner-comparison">
          <div><span>Current payment plan</span><strong>{standard.canPayOff ? `${Math.ceil(standard.months / 12)} years ${standard.months % 12} months` : "No payoff at this payment"}</strong><small>Interest: {amount(standard.totalInterest, currencyCode)}</small></div>
          <div className="comparison-highlight"><span>With extra payment</span><strong>{accelerated.canPayOff ? `${Math.ceil(accelerated.months / 12)} years ${accelerated.months % 12} months` : "No payoff at this payment"}</strong><small>Interest: {amount(accelerated.totalInterest, currencyCode)}</small></div>
        </div>
        {extra > 0 && <div className="loan-savings-callout"><ArrowDownRight size={16} />{paidEarlierMonths > 0 ? `Estimated interest saved: ${amount(interestSaved, currencyCode)} · paid off ${paidEarlierMonths} months earlier.` : "Compare the schedules to see the effect of extra payments."}</div>}
        <div className="loan-chart" role="img" aria-label="Yearly remaining loan balance comparison">
          <div className="loan-chart-legend"><span><i className="loan-legend-standard" />Current payment</span><span><i className="loan-legend-extra" />With extra</span></div>
          <div className="loan-chart-years">{yearRows.map((row) => <div className="loan-chart-year" key={row.year}>
            <div className="loan-bar-pair">
              <i className="loan-bar-standard" style={{ height: `${row.standard === undefined ? 0 : Math.max(2, row.standard / maxLoanBalance * 100)}%` }} />
              <i className="loan-bar-extra" style={{ height: `${row.accelerated === undefined ? 0 : Math.max(2, row.accelerated / maxLoanBalance * 100)}%` }} />
            </div><small>{row.year === 0 ? "Now" : `Yr ${row.year}`}</small>
          </div>)}</div>
        </div>
        <div className="projection-table-wrap">
          <table className="projection-table">
            <thead><tr><th>Year</th><th>Balance · current plan</th><th>Balance · with extra</th><th>Interest · current plan</th><th>Interest · with extra</th></tr></thead>
            <tbody>{yearRows.map((row) => {
              const normal = standard.yearlyBalances.find((item) => item.year === row.year);
              const extraRow = accelerated.yearlyBalances.find((item) => item.year === row.year);
              return <tr key={row.year}><td>{row.year === 0 ? "Today" : `Year ${row.year}`}</td><td>{row.standard === undefined ? "—" : amount(row.standard, currencyCode)}</td><td>{row.accelerated === undefined ? "—" : amount(row.accelerated, currencyCode)}</td><td>{normal ? amount(normal.interestPaid, currencyCode) : "—"}</td><td>{extraRow ? amount(extraRow.interestPaid, currencyCode) : "—"}</td></tr>;
            })}</tbody>
          </table>
        </div>
        <div className="planner-footnote">Estimate assumes a constant rate and payment; it does not account for fees, taxes, insurance, or lender-specific terms.</div>
      </article>
      <aside className="panel planner-side"><span className="planner-side-icon"><ArrowDownRight size={19} /></span><h2>Explore a little extra.</h2><p>Even a modest additional payment can change the payoff timeline. Check loan terms and prepayment rules with your lender.</p><div className="planner-side-stat"><span>Extra each month</span><strong>{amount(extra, currencyCode)}</strong></div><div className="planner-side-stat"><span>Extra each year</span><strong>{amount(extra * 12, currencyCode)}</strong></div></aside>
    </section>
  );
}

export function FinanceTools({
  section,
  goals,
  currencyCode,
  onSaveGoal,
  onDeleteGoal,
}: {
  section: ToolSection;
  goals: SavingsGoal[];
  currencyCode: string;
  onSaveGoal: (goal: Omit<SavingsGoal, "id">, id?: string) => void;
  onDeleteGoal: (goalId: string) => void;
}) {
  if (section === "Saving planner" || section === "Investment planner") {
    return <CompoundPlanner section={section} currencyCode={currencyCode} />;
  }
  if (section === "Home loan planner") return <HomeLoanPlanner currencyCode={currencyCode} />;
  return <SavingsGoals goals={goals} currencyCode={currencyCode} onSaveGoal={onSaveGoal} onDeleteGoal={onDeleteGoal} />;
}

function SavingsGoals({
  goals,
  currencyCode,
  onSaveGoal,
  onDeleteGoal,
}: {
  goals: SavingsGoal[];
  currencyCode: string;
  onSaveGoal: (goal: Omit<SavingsGoal, "id">, id?: string) => void;
  onDeleteGoal: (goalId: string) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [monthly, setMonthly] = useState("");
  const [annualReturn, setAnnualReturn] = useState("0");
  const [years, setYears] = useState("3");
  const [planType, setPlanType] = useState<"savings" | "fire">("savings");
  const [postFiYears, setPostFiYears] = useState("30");
  const [postFiAnnualReturn, setPostFiAnnualReturn] = useState("1");
  const [withdrawalRate, setWithdrawalRate] = useState("4");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const yearsValue = yearCount(years, 3);
  const returnValue = returnNumber(annualReturn, 0);
  const postFiYearsValue = Math.min(60, Math.max(1, Math.round(Number(postFiYears) || 30)));
  const postFiReturnValue = returnNumber(postFiAnnualReturn, 1);
  const withdrawalRateValue = Math.min(100, Math.max(0, Number(withdrawalRate) || 0));
  const previewGoal: SavingsGoal = {
    id: editingId ?? "preview",
    name,
    targetAmount: positiveNumber(target, 0),
    currentAmount: positiveNumber(current, 0),
    monthlyContribution: positiveNumber(monthly, 0),
    annualReturn: returnValue,
    targetYears: yearsValue,
    planType,
    postFiYears: postFiYearsValue,
    postFiAnnualReturn: postFiReturnValue,
    withdrawalRate: withdrawalRateValue,
  };
  const savingsRows = useMemo(
    () => savingsProjection(previewGoal.currentAmount, previewGoal.monthlyContribution, returnValue, yearsValue),
    [previewGoal.currentAmount, previewGoal.monthlyContribution, returnValue, yearsValue],
  );
  const fireRows = fireProjection(previewGoal);
  const previewRows = planType === "fire" ? fireRows : savingsRows;

  function resetForm() {
    setName("");
    setTarget("");
    setCurrent("0");
    setMonthly("");
    setAnnualReturn("0");
    setYears("3");
    setPlanType("savings");
    setPostFiYears("30");
    setPostFiAnnualReturn("1");
    setWithdrawalRate("4");
    setEditingId(null);
    setError("");
  }

  function beginEdit(goal: SavingsGoal) {
    setEditingId(goal.id);
    setName(goal.name);
    setTarget(String(goal.targetAmount));
    setCurrent(String(goal.currentAmount));
    setMonthly(String(goal.monthlyContribution));
    setAnnualReturn(String(goal.annualReturn));
    setYears(String(goal.targetYears ?? 5));
    setPlanType(goal.planType ?? "savings");
    setPostFiYears(String(goal.postFiYears ?? 30));
    setPostFiAnnualReturn(String(goal.postFiAnnualReturn ?? 1));
    setWithdrawalRate(String(goal.withdrawalRate ?? 4));
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetValue = Number(target);
    const currentValue = Number(current);
    const monthlyValue = Number(monthly);
    const returnValueInput = Number(annualReturn);
    if (!name.trim() || !Number.isFinite(targetValue) || targetValue <= 0
      || !Number.isFinite(currentValue) || currentValue < 0
      || !Number.isFinite(monthlyValue) || monthlyValue < 0
      || !Number.isFinite(returnValueInput) || returnValueInput <= -100 || returnValueInput > 100) {
      setError("Enter a name, positive target, non-negative amounts, and a return between -99.9% and 100%.");
      return;
    }
    const postYearsInput = Number(postFiYears);
    const postReturnInput = Number(postFiAnnualReturn);
    const withdrawalInput = Number(withdrawalRate);
    if (planType === "fire" && (!Number.isInteger(postYearsInput) || postYearsInput < 1 || postYearsInput > 60
      || !Number.isFinite(postReturnInput) || postReturnInput <= -100 || postReturnInput > 100
      || !Number.isFinite(withdrawalInput) || withdrawalInput < 0 || withdrawalInput > 100)) {
      setError("Enter a post-FI duration of 1–60 years, a return above -100% and no more than 100%, and a withdrawal rate from 0% to 100%.");
      return;
    }
    onSaveGoal({
      name: name.trim(),
      targetAmount: targetValue,
      currentAmount: currentValue,
      monthlyContribution: monthlyValue,
      annualReturn: returnValueInput,
      targetYears: yearsValue,
      planType,
      ...(planType === "fire" ? {
        postFiYears: postYearsInput,
        postFiAnnualReturn: postReturnInput,
        withdrawalRate: withdrawalInput,
      } : {}),
    }, editingId ?? undefined);
    resetForm();
  }

  return (
    <section className="goals-layout">
      <article className="panel goals-list-panel">
        <div className="panel-header"><div><h2>Your savings goals</h2><p>Give the next thing you&apos;re saving for a name and a plan.</p></div><span className="activity-count">{goals.length} goals</span></div>
        {goals.length === 0 ? <div className="empty-goals"><span className="empty-icon"><Sparkles size={19} /></span><strong>A goal makes saving feel real.</strong><p>Create a savings or FIRE goal to see a visual and year-by-year projection.</p></div> : <div className="goal-cards">{goals.map((goal) => {
          const progress = Math.min(100, goal.targetAmount ? goal.currentAmount / goal.targetAmount * 100 : 0);
          const targetYears = goal.targetYears ?? 5;
          const fireGoal = goal.planType === "fire";
          const rows = fireGoal ? fireProjection(goal) : savingsProjection(goal.currentAmount, goal.monthlyContribution, goal.annualReturn, targetYears);
          const maxBalance = Math.max(1, ...rows.map((row) => row.balance));
          const fiBalance = rows[targetYears]?.balance ?? goal.currentAmount;
          const targetShortfall = Math.max(0, goal.targetAmount - fiBalance);
          const requiredContribution = requiredMonthlyContribution(goal.targetAmount, goal.currentAmount, goal.annualReturn, targetYears);
          return (
            <article className="goal-card" key={goal.id}>
              <div className="goal-card-heading"><span><strong>{goal.name} {fireGoal && <i className="fire-badge">FIRE</i>}</strong><small>{amount(goal.currentAmount, currencyCode)} saved of {amount(goal.targetAmount, currencyCode)} · {fireGoal ? `FI target in ${targetYears} years` : `Target in ${targetYears} years`}</small></span><span className="record-actions"><button className="icon-button" aria-label={`Edit ${goal.name}`} onClick={() => beginEdit(goal)}><Pencil size={14} /></button><button className="icon-button goal-delete" aria-label={`Delete ${goal.name}`} onClick={() => onDeleteGoal(goal.id)}><Trash2 size={16} /></button></span></div>
              <div className="goal-progress"><i style={{ width: `${progress}%` }} /></div>
              <div className="goal-progress-caption"><span>{Math.round(progress)}% saved</span><span>{amount(goal.monthlyContribution, currencyCode)} / month</span></div>
              {fireGoal && <div className="fire-summary"><span>Post-FI plan: {goal.postFiYears ?? 30} years at {goal.postFiAnnualReturn ?? 1}% return, withdrawing {goal.withdrawalRate ?? 4}% of the FI balance ({amount(fiBalance * (goal.withdrawalRate ?? 4) / 100, currencyCode)} / year). {targetShortfall > 0 ? `Your planned contribution projects ${amount(targetShortfall, currencyCode)} below the FI target; about ${amount(requiredContribution, currencyCode)} / month is needed to reach it.` : "The FI target is reached at the end of the accumulation period."}</span></div>}
              <div className={`fire-chart ${fireGoal ? "fire-chart-phases" : ""}`} role="img" aria-label={fireGoal ? "FIRE projection: savings accumulation followed by retirement withdrawals" : "Savings goal projected balance by year"}>
                {rows.map((row) => {
                  const balance = row.balance;
                  const isRetirement = fireGoal && "phase" in row && row.phase === "Financial independence";
                  return <span className="fire-chart-column" key={row.year}><strong>{amount(balance, currencyCode)}</strong><i style={{ height: `${Math.max(3, balance / maxBalance * 100)}%`, background: isRetirement ? "#6fb5a4" : "#7a83e6" }} /><small>{row.year === 0 ? "Now" : `Yr ${row.year}`}</small></span>;
                })}
              </div>
              {fireGoal && <div className="fire-legend"><span><i />Accumulation</span><span><i />Post-FI withdrawals</span></div>}
              <div className="projection-table-wrap goal-table-wrap"><table className="projection-table"><thead><tr><th>Year</th>{fireGoal && <th>Phase</th>}{fireGoal && <th>Withdrawal</th>}<th>Projected balance</th><th>Target progress</th></tr></thead><tbody>{rows.map((row) => {
                const isRetirement = fireGoal && "phase" in row && row.phase === "Financial independence";
                const annualWithdrawal = fireGoal && "annualWithdrawal" in row ? row.annualWithdrawal : 0;
                const progress = fireGoal && row.year > targetYears && fiBalance >= goal.targetAmount
                  ? 100
                  : Math.min(100, Math.round(row.balance / Math.max(1, goal.targetAmount) * 100));
                return <tr key={row.year}><td>{row.year === 0 ? "Today" : `Year ${row.year}`}</td>{fireGoal && <td>{isRetirement ? "Post-FI" : row.year === targetYears ? "FI milestone" : "Accumulation"}</td>}{fireGoal && <td>{annualWithdrawal ? amount(annualWithdrawal, currencyCode) : "—"}</td>}<td>{amount(row.balance, currencyCode)}</td><td>{progress}%</td></tr>;
              })}</tbody></table></div>
            </article>
          );
        })}</div>}
      </article>
      <aside className="panel goal-form-panel">
        <div className="panel-header"><div><h2>{editingId ? "Edit goal" : "Create a goal"}</h2><p>Plan a savings target or the path to financial independence.</p></div>{editingId && <button className="icon-button" aria-label="Cancel editing" onClick={resetForm}><X size={15} /></button>}</div>
        <form className="goal-form" onSubmit={submit}>
          <label className="planner-field"><span>What are you saving for?</span><input aria-label="Goal name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. First home" /></label>
          <label className="planner-field"><span>Plan type</span><select aria-label="Plan type" value={planType} onChange={(event) => setPlanType(event.target.value as "savings" | "fire")}><option value="savings">Savings goal</option><option value="fire">FIRE (financial independence)</option></select></label>
          <NumberField label={`${planType === "fire" ? "FI portfolio target" : "Target amount"} (${currencyCode})`} value={target} onChange={setTarget} min={0} />
          <NumberField label={`Already saved (${currencyCode})`} value={current} onChange={setCurrent} min={0} />
          <NumberField label={`Monthly contribution (${currencyCode})`} value={monthly} onChange={setMonthly} min={0} />
          <NumberField label="Accumulation annual return" value={annualReturn} onChange={setAnnualReturn} min={-99.9} max={100} suffix="%" step="0.1" />
          <NumberField label={planType === "fire" ? "Years to FI target" : "Projection horizon"} value={years} onChange={setYears} min={1} max={50} suffix="years" step="1" />
          {planType === "fire" && <div className="fire-assumptions">
            <p>After the FI target is reached</p>
            <NumberField label="Post-FI duration" value={postFiYears} onChange={setPostFiYears} min={1} max={60} suffix="years" step="1" />
            <NumberField label="Post-FI annual return" value={postFiAnnualReturn} onChange={setPostFiAnnualReturn} min={-99.9} max={100} suffix="%" step="0.1" />
            <NumberField label="Annual withdrawal rate" value={withdrawalRate} onChange={setWithdrawalRate} min={0} max={100} suffix="%" step="0.1" />
            <small>Annual withdrawals are fixed at this percentage of the projected FI balance, with investment return applied each year.</small>
          </div>}
          {error && <p className="planner-warning" role="alert">{error}</p>}
          <button type="submit" className="primary-button">{editingId ? <Pencil size={15} /> : <Plus size={15} />}{editingId ? "Save changes" : "Save goal"}</button>
        </form>
        <div className="goal-preview"><span>{planType === "fire" ? `Balance after ${yearsValue + postFiYearsValue} years` : `Projected after ${yearsValue} years`}</span><strong>{amount(previewRows[previewRows.length - 1]?.balance ?? 0, currencyCode)}</strong></div>
      </aside>
    </section>
  );
}
