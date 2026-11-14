"use client";

import { CalendarRange, Copy, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { currency, type BudgetPlan, type BudgetPlanCategory } from "@/lib/finance";

const categoryColors = ["#7a83e6", "#e5aa68", "#6fb5a4", "#e78c92", "#8e79bd", "#72a5c5"];

function monthIndex(value: string) {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}

function monthString(index: number) {
  const year = Math.floor(index / 12);
  const month = index % 12 + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function getEndMonth(plan: Pick<BudgetPlan, "startMonth" | "durationMonths">) {
  return monthString(monthIndex(plan.startMonth) + plan.durationMonths - 1);
}

function emptyCategories(): BudgetPlanCategory[] {
  return [
    { category: "Housing", group: "Needs", allocationPercent: 30, color: categoryColors[0] },
    { category: "Food & dining", group: "Needs", allocationPercent: 15, color: categoryColors[1] },
    { category: "Lifestyle", group: "Wants", allocationPercent: 20, color: categoryColors[2] },
    { category: "Savings & investing", group: "Savings", allocationPercent: 35, color: categoryColors[3] },
  ];
}

function planYearRows(plan: BudgetPlan) {
  const rows: { year: number; months: number; income: number; allocated: number }[] = [];
  const start = monthIndex(plan.startMonth);
  const end = start + plan.durationMonths - 1;
  for (let index = start; index <= end;) {
    const year = Math.floor(index / 12);
    const yearEnd = year * 12 + 11;
    const months = Math.min(end, yearEnd) - index + 1;
    const income = Math.max(0, plan.monthlyIncome) * months;
    const allocation = plan.categories.reduce((total, category) => total + category.allocationPercent, 0) / 100;
    rows.push({ year, months, income, allocated: income * allocation });
    index += months;
  }
  return rows;
}

export function BudgetPlanner({
  plans,
  monthlyIncome,
  currencyCode,
  onSavePlans,
}: {
  plans: BudgetPlan[];
  monthlyIncome: number;
  currencyCode: string;
  onSavePlans: (plans: BudgetPlan[]) => void;
}) {
  const nowMonth = new Date().toISOString().slice(0, 7);
  const [viewMonth, setViewMonth] = useState(nowMonth);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState(nowMonth);
  const [durationMonths, setDurationMonths] = useState("12");
  const [income, setIncome] = useState(String(monthlyIncome || 0));
  const [categories, setCategories] = useState<BudgetPlanCategory[]>(emptyCategories);
  const [error, setError] = useState("");

  const applicablePlans = useMemo(() => plans
    .filter((plan) => monthIndex(viewMonth) >= monthIndex(plan.startMonth)
      && monthIndex(viewMonth) <= monthIndex(getEndMonth(plan)))
    .sort((a, b) => monthIndex(b.startMonth) - monthIndex(a.startMonth)), [plans, viewMonth]);
  const activePlan = applicablePlans[0];
  const allocationTotal = categories.reduce((total, category) => total + (Number(category.allocationPercent) || 0), 0);

  function resetForm() {
    setEditingId(null);
    setName("");
    setStartMonth(nowMonth);
    setDurationMonths("12");
    setIncome(String(monthlyIncome || 0));
    setCategories(emptyCategories());
    setError("");
    setFormOpen(false);
  }

  function beginEdit(plan: BudgetPlan) {
    setEditingId(plan.id);
    setName(plan.name);
    setStartMonth(plan.startMonth);
    setDurationMonths(String(plan.durationMonths));
    setIncome(String(plan.monthlyIncome));
    setCategories(plan.categories.map((category) => ({ ...category })));
    setError("");
    setFormOpen(true);
  }

  function beginClone(plan: BudgetPlan) {
    setEditingId(null);
    setName(`${plan.name} copy`);
    setStartMonth(monthString(monthIndex(getEndMonth(plan)) + 1));
    setDurationMonths(String(plan.durationMonths));
    setIncome(String(plan.monthlyIncome));
    setCategories(plan.categories.map((category) => ({ ...category })));
    setError("");
    setFormOpen(true);
  }

  function updateCategory(index: number, update: Partial<BudgetPlanCategory>) {
    setCategories((current) => current.map((category, itemIndex) => itemIndex === index
      ? { ...category, ...update }
      : category));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const months = Number(durationMonths);
    const monthlyIncomeValue = Number(income);
    const startMonthNumber = Number(startMonth.split("-")[1]);
    const validCategories = categories.filter((category) => category.category.trim());
    if (!name.trim() || !/^\d{4}-\d{2}$/.test(startMonth) || startMonthNumber < 1 || startMonthNumber > 12
      || !Number.isInteger(months) || months < 1 || months > 120
      || !Number.isFinite(monthlyIncomeValue) || monthlyIncomeValue < 0 || validCategories.length === 0
      || validCategories.some((category) => !category.group.trim() || !Number.isFinite(category.allocationPercent) || category.allocationPercent < 0 || category.allocationPercent > 100)
      || allocationTotal > 100) {
      setError("Enter a plan name, valid date range, non-negative income, category groups, and allocations totaling no more than 100%.");
      return;
    }

    const proposedEnd = monthIndex(startMonth) + months - 1;
    const overlaps = plans.some((plan) => plan.id !== editingId
      && monthIndex(startMonth) <= monthIndex(getEndMonth(plan))
      && monthIndex(plan.startMonth) <= proposedEnd);
    if (overlaps) {
      setError("This date range overlaps another budget profile. Choose a separate range or edit the existing profile.");
      return;
    }

    const plan: BudgetPlan = {
      id: editingId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `budget-${Date.now()}`),
      name: name.trim(),
      startMonth,
      durationMonths: months,
      monthlyIncome: monthlyIncomeValue,
      categories: validCategories.map((category) => ({ ...category, category: category.category.trim(), group: category.group.trim() })),
    };
    onSavePlans(editingId
      ? plans.map((item) => item.id === editingId ? plan : item)
      : [...plans, plan]);
    setViewMonth(startMonth);
    resetForm();
  }

  function deletePlan(planId: string) {
    onSavePlans(plans.filter((plan) => plan.id !== planId));
  }

  function addCategory() {
    setCategories((current) => [...current, {
      category: "",
      group: "Other",
      allocationPercent: 0,
      color: categoryColors[current.length % categoryColors.length],
    }]);
  }

  return (
    <section className="panel budget-profiles-panel">
      <div className="panel-header">
        <div><h2>Budget profiles & yearly forecast</h2><p>Save a reusable allocation, then apply it to a range of months.</p></div>
        <button className="primary-button" onClick={() => { resetForm(); setFormOpen(true); }}><Plus size={15} />Create budget profile</button>
      </div>
      <div className="budget-profile-controls">
        <label>View month<input aria-label="View month" type="month" value={viewMonth} onChange={(event) => setViewMonth(event.target.value)} /></label>
        <span><CalendarRange size={15} />{activePlan ? `Applied: ${activePlan.name}` : "No profile applies to this month"}</span>
      </div>

      {activePlan && (
        <div className="active-budget-profile">
          <div className="active-budget-heading"><strong>{activePlan.name}</strong><span>{formatMonth(viewMonth)} · {currency(activePlan.monthlyIncome, currencyCode)} monthly income basis</span></div>
          <div className="allocation-bar" role="img" aria-label={`Budget allocations total ${activePlan.categories.reduce((sum, item) => sum + item.allocationPercent, 0)} percent`}>
            {activePlan.categories.map((category, index) => <i key={`${category.category}-${index}`} title={`${category.group}: ${category.allocationPercent}%`} style={{ width: `${category.allocationPercent}%`, background: category.color }} />)}
          </div>
          <div className="budget-category-table">
            {activePlan.categories.map((category, index) => (
              <div className="budget-category-row" key={`${category.category}-${index}`}>
                <span className="budget-color-dot" style={{ background: category.color }} />
                <strong>{category.category}</strong>
                <span className="budget-group-label">{category.group}</span>
                <span>{category.allocationPercent}%</span>
                <b>{currency(activePlan.monthlyIncome * category.allocationPercent / 100, currencyCode)}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {plans.length ? <div className="budget-plan-list">{plans.map((plan) => {
        const start = monthIndex(plan.startMonth);
        const end = monthIndex(getEndMonth(plan));
        const appliesNow = monthIndex(viewMonth) >= start && monthIndex(viewMonth) <= end;
        const grouped = plan.categories.reduce<Record<string, number>>((groups, category) => {
          groups[category.group] = (groups[category.group] ?? 0) + category.allocationPercent;
          return groups;
        }, {});
        const years = planYearRows(plan);
        return (
          <article className={`budget-plan-card ${appliesNow ? "budget-plan-active" : ""}`} key={plan.id}>
            <div className="budget-plan-heading">
              <span><strong>{plan.name}</strong><small>{formatMonth(plan.startMonth)} – {formatMonth(getEndMonth(plan))} · {plan.durationMonths} months{appliesNow ? " · Applies to selected month" : ""}</small></span>
              <span className="record-actions">
                <button className="icon-button" aria-label={`Edit ${plan.name}`} onClick={() => beginEdit(plan)}><Pencil size={14} /></button>
                <button className="icon-button" aria-label={`Clone ${plan.name} to another range`} onClick={() => beginClone(plan)}><Copy size={14} /></button>
                <button className="icon-button" aria-label={`Delete ${plan.name}`} onClick={() => deletePlan(plan.id)}><Trash2 size={14} /></button>
              </span>
            </div>
            <div className="allocation-bar" aria-hidden="true">{plan.categories.map((category, index) => <i key={`${category.category}-${index}`} title={`${category.group}: ${category.allocationPercent}%`} style={{ width: `${category.allocationPercent}%`, background: category.color }} />)}</div>
            <div className="budget-group-summary">{Object.entries(grouped).map(([group, percent]) => <span key={group}><i />{group} <b>{percent}%</b></span>)}</div>
            <div className="projection-table-wrap">
              <table className="projection-table">
                <thead><tr><th>Calendar year</th><th>Months covered</th><th>Income basis</th><th>Planned allocation</th></tr></thead>
                <tbody>{years.map((row) => <tr key={row.year}><td>{row.year}</td><td>{row.months}</td><td>{currency(row.income, currencyCode)}</td><td>{currency(row.allocated, currencyCode)}</td></tr>)}</tbody>
              </table>
            </div>
          </article>
        );
      })}</div> : <div className="empty-budget-profiles"><strong>No reusable budget profiles yet.</strong><span>Create one to assign categories to groups and project allocations across years.</span></div>}

      {formOpen && (
        <form className="budget-profile-form" onSubmit={submit}>
          <div className="budget-form-heading"><div><h3>{editingId ? "Edit budget profile" : "Create budget profile"}</h3><p>Allocation percentages use the monthly income basis and repeat for every covered month.</p></div><button type="button" className="icon-button" aria-label="Close budget form" onClick={resetForm}><X size={16} /></button></div>
          <div className="planner-fields budget-profile-fields">
            <label className="planner-field"><span>Profile name</span><input aria-label="Budget profile name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. 50/30/20 plan" /></label>
            <label className="planner-field"><span>Start month</span><input aria-label="Profile start month" required type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} /></label>
            <label className="planner-field"><span>Apply for months</span><input aria-label="Profile duration in months" required type="number" min="1" max="120" step="1" value={durationMonths} onChange={(event) => setDurationMonths(event.target.value)} /></label>
            <label className="planner-field"><span>Monthly income basis ({currencyCode})</span><input aria-label="Monthly income basis" required type="number" min="0" step="0.01" value={income} onChange={(event) => setIncome(event.target.value)} /></label>
          </div>
          <div className="budget-category-editor">
            <div className="budget-category-editor-heading"><strong>Category allocations</strong><span>{allocationTotal}% assigned · {Math.max(0, 100 - allocationTotal)}% unassigned</span></div>
            {categories.map((category, index) => (
              <div className="budget-category-edit-row" key={`${index}-${category.category}`}>
                <label><span>Category</span><input aria-label={`Category ${index + 1}`} required value={category.category} onChange={(event) => updateCategory(index, { category: event.target.value })} /></label>
                <label><span>Group</span><input aria-label={`Group ${index + 1}`} required value={category.group} onChange={(event) => updateCategory(index, { group: event.target.value })} /></label>
                <label><span>Income %</span><input aria-label={`Allocation ${index + 1} percent`} required type="number" min="0" max="100" step="0.1" value={category.allocationPercent} onChange={(event) => updateCategory(index, { allocationPercent: Number(event.target.value) })} /></label>
                <strong>{currency((Number(income) || 0) * category.allocationPercent / 100, currencyCode)}</strong>
                <button type="button" className="icon-button" aria-label={`Remove category ${index + 1}`} disabled={categories.length === 1} onClick={() => setCategories((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" className="text-link" onClick={addCategory}><Plus size={14} />Add category</button>
          </div>
          {error && <p className="planner-warning" role="alert">{error}</p>}
          <div className="budget-form-actions"><button type="button" className="soft-button" onClick={resetForm}>Cancel</button><button type="submit" className="primary-button">{editingId ? "Save changes" : "Save budget profile"}</button></div>
        </form>
      )}
    </section>
  );
}
