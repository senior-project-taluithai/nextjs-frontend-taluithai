import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  Car,
  Bed,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type {
  BudgetData,
  BudgetCategory,
  BudgetExpense,
} from "@/hooks/useAgentChat";

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "accommodation", name: "Accommodation", color: "#7C3AED", allocated: 0, spent: 0 },
  { id: "food", name: "Food", color: "#10b981", allocated: 0, spent: 0 },
  { id: "transport", name: "Transport", color: "#3b82f6", allocated: 0, spent: 0 },
  { id: "activities", name: "Activities", color: "#f59e0b", allocated: 0, spent: 0 },
];

function normalizeBudgetData(budget: any, daysCount: number): BudgetData {
  if (!budget) {
    return { total: 0, categories: DEFAULT_CATEGORIES, expenses: [], dailyBudgets: [] };
  }
  
  if (budget.categories && Array.isArray(budget.categories)) {
    return {
      total: budget.total || 0,
      suggested_spent: budget.suggested_spent,
      categories: budget.categories,
      expenses: budget.expenses || [],
      dailyBudgets: budget.dailyBudgets || [],
    };
  }
  
  const categories: BudgetCategory[] = [
    { id: "accommodation", name: "Accommodation", color: "#7C3AED", allocated: budget.accommodation || 0, spent: 0 },
    { id: "food", name: "Food", color: "#10b981", allocated: budget.food || 0, spent: 0 },
    { id: "transport", name: "Transport", color: "#3b82f6", allocated: budget.transport || 0, spent: 0 },
    { id: "activities", name: "Activities", color: "#f59e0b", allocated: budget.activities || 0, spent: 0 },
  ];
  
  const dailyBudgets = daysCount > 0
    ? Array.from({ length: daysCount }, (_, i) => ({
        day: i + 1,
        allocated: Math.round((budget.total || 0) / daysCount),
        spent: 0,
      }))
    : [];
  
  return {
    total: budget.total || 0,
    categories,
    expenses: [],
    dailyBudgets,
  };
}

/* ─── Category config ─────────────────────────── */
const CAT_INFO = {
  accommodation: {
    icon: Bed,
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-200",
  },
  hotel: {
    icon: Bed,
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-200",
  },
  food_dining: {
    icon: UtensilsCrossed,
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  food: {
    icon: UtensilsCrossed,
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  transport: {
    icon: Car,
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
  activities: {
    icon: Ticket,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  ticket: {
    icon: Ticket,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  shopping: {
    icon: ShoppingBag,
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
  },
  other: {
    icon: MoreHorizontal,
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
  },
} as const;

function getCatInfo(id: string) {
  return CAT_INFO[id as keyof typeof CAT_INFO] || CAT_INFO.other;
}

function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return hex;
}

/* ─── Custom Tooltip ─── */
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-emerald-600 font-bold">
        ฿{Number(payload[0].value).toLocaleString()}
      </p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────── */
export function BudgetPanel({
  data,
  daysCount,
  onUpdateBudget,
}: {
  data?: BudgetData | null;
  daysCount: number;
  onUpdateBudget?: (newData: BudgetData) => void;
}) {
  const normalizedData = normalizeBudgetData(data, daysCount);

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpCategoryId, setNewExpCategoryId] = useState("");
  const [newExpDay, setNewExpDay] = useState("1");
  const [newExpNote, setNewExpNote] = useState("");

  // Local state to temporarily hold new expenses added via UI
  const [localAddedExpenses, setLocalAddedExpenses] = useState<BudgetExpense[]>(
    [],
  );

  // Merge normalizedData.expenses and localAddedExpenses, ensuring unique IDs
  // This allows optimistic UI updates without showing duplicates when the backend data refreshes
  const allExpensesRaw = [...(normalizedData.expenses || []), ...localAddedExpenses];
  const uniqueExpensesMap = new Map<string, BudgetExpense>();
  allExpensesRaw.forEach((exp) => {
    if (exp && exp.id) {
      uniqueExpensesMap.set(exp.id, exp);
    }
  });
  const allExpenses = Array.from(uniqueExpensesMap.values()).filter(Boolean);

  /* derived numbers dynamically calculated from allExpenses */
  const totalBudget = normalizedData.total || 0; // Maximum Budget
  const totalSpent = useMemo(
    () => allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [allExpenses],
  );

  const totalAllocated = useMemo(
    () => (normalizedData.categories || []).reduce((s, c) => s + (c.allocated || 0), 0),
    [normalizedData.categories],
  );

  const spentPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const displaySpentPct = Math.min(spentPct, 100);
  const overBudget = totalSpent > totalBudget && totalBudget > 0;
  const remaining = Math.abs(totalBudget - totalSpent);
  const suggestedPct = totalBudget > 0 && normalizedData.suggested_spent 
    ? Math.min((normalizedData.suggested_spent / totalBudget) * 100, 100) 
    : null;

  // Recalculate categories dynamically
  const categories = useMemo(() => {
    return (normalizedData.categories || []).map((cat) => {
      const catSpent = allExpenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      return { ...cat, spent: catSpent };
    });
  }, [normalizedData.categories, allExpenses]);

  // Recalculate daily budgets dynamically
  const dailyBudgets = useMemo(() => {
    return (normalizedData.dailyBudgets || []).map((db) => {
      const daySpent = allExpenses
        .filter((e) => e.day === db.day)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      return { ...db, spent: daySpent };
    });
  }, [normalizedData.dailyBudgets, allExpenses]);

  /* Fix for recharts pie - ensuring data exists and mapping properties correctly */
  const pieData = useMemo(() => {
    return categories
      .filter((c) => (c.allocated || 0) > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        value: c.allocated || 0,
        fill: c.color || "#94a3b8",
      }));
  }, [categories]);

  /* Bar data mapping for recharts */
  const barData = useMemo(() => {
    return categories
      .filter((c) => (c.allocated || 0) > 0)
      .map((c) => ({
        name: c.name,
        total: c.allocated || 0,
      }));
  }, [categories]);

  /* Daily spending data from expenses */
  const dailySpendingData = useMemo(() => {
    const dayMap = new Map<number, number>();
    for (const exp of allExpenses) {
      const day = exp.day || 1;
      dayMap.set(day, (dayMap.get(day) || 0) + (exp.amount || 0));
    }
    return Array.from(dayMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, spent]) => ({
        name: `Day ${day}`,
        spent,
        allocated:
          normalizedData.dailyBudgets?.find((d) => d.day === day)?.allocated ||
          Math.round(totalBudget / daysCount),
      }));
  }, [allExpenses, normalizedData.dailyBudgets, totalBudget, daysCount]);

  return (
    <div>
      <div className="px-5 py-5 space-y-5">
        {/* ── Budget Overview Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Estimated Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{totalBudget.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Actual Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{totalSpent.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-2">
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div
                className={`h-full rounded-full ${overBudget ? "bg-red-500" : spentPct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${displaySpentPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {suggestedPct !== null && suggestedPct > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
                  style={{ left: `${suggestedPct}%` }}
                  title={`Suggested: ฿${normalizedData.suggested_spent?.toLocaleString()}`}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-400">
                {spentPct.toFixed(0)}% Spent
              </span>
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${overBudget ? "text-red-500" : "text-emerald-600"}`}
              >
                {overBudget ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {overBudget
                  ? `Over by ฿${remaining.toLocaleString()}`
                  : `Under by ฿${remaining.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Over-budget warning */}
          <AnimatePresence>
            {overBudget && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-5 mb-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-500">
                    Expenses exceed the estimated total budget.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mini stat row */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
            {[
              {
                label: "Items/Categories",
                value: categories.length + " categories",
              },
              {
                label: "Avg/Day (Based on Spent)",
                value: `฿${Math.round(totalSpent / (daysCount || 1)).toLocaleString()}`,
              },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 gap-4">
          {/* Donut — category */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">
              Cost Composition
            </p>
            {pieData.length > 0 ? (
              <>
                <div className="flex justify-center -mt-2">
                  <PieChart width={120} height={120}>
                    <Pie
                      data={pieData}
                      cx={55}
                      cy={55}
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                      isAnimationActive={true}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.fill }}
                        />
                        <span
                          className="text-xs text-gray-500 truncate w-16"
                          title={c.name}
                        >
                          {c.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        ฿{c.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-300 text-xs">
                No Data
              </div>
            )}
          </div>

          {/* Bar — Categories */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Distribution</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart
                data={barData}
                barSize={14}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `฿${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                  }
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#10b981">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Spending Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">
              Daily Spending
            </p>
            {dailySpendingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart
                  data={dailySpendingData}
                  barSize={20}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `฿${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const spent =
                        (payload.find((p) => p.dataKey === "spent")
                          ?.value as number) || 0;
                      const allocated =
                        (payload.find((p) => p.dataKey === "allocated")
                          ?.value as number) || 0;
                      return (
                        <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-xs">
                          <p className="font-semibold text-gray-700 mb-1">
                            {label}
                          </p>
                          <p className="text-emerald-600 font-bold">
                            Spent: ฿{spent.toLocaleString()}
                          </p>
                          <p className="text-gray-500">
                            Budget: ฿{allocated.toLocaleString()}
                          </p>
                        </div>
                      );
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="spent"
                    radius={[4, 4, 0, 0]}
                    fill="#f59e0b"
                    name="Spent"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-300 text-xs">
                No Data
              </div>
            )}
          </div>
        </div>

        {/* ── Category List ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-gray-800 text-sm">
                Allocated Categories
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {categories.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-300">No categories allocated</p>
              </div>
            ) : (
              categories.map((cat) => {
                const info = getCatInfo(cat.id);
                const Icon = info.icon;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: hexToRgba(cat.color, 0.12) }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {cat.name}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          Limit: ฿{(cat.allocated || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full`}
                          style={{
                            backgroundColor:
                              (cat.spent || 0) > (cat.allocated || 0)
                                ? "#ef4444"
                                : cat.color,
                            width: `${Math.min(((cat.spent || 0) / (cat.allocated || 1)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">
                          Spent: ฿{(cat.spent || 0).toLocaleString()}
                        </span>
                        <span
                          className={`${(cat.allocated || 0) - (cat.spent || 0) < 0 ? "text-red-500 font-medium" : "text-gray-400"}`}
                        >
                          {(cat.allocated || 0) - (cat.spent || 0) < 0
                            ? `Over by ฿${Math.abs((cat.allocated || 0) - (cat.spent || 0)).toLocaleString()}`
                            : `฿${((cat.allocated || 0) - (cat.spent || 0)).toLocaleString()} left`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {categories.length} Categories
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Allocated</span>
              <span className="text-sm font-bold text-gray-900">
                ฿{totalAllocated.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Daily Budgets List ── */}
        {dailyBudgets && dailyBudgets.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-50">
              <span className="font-bold text-gray-500 text-xs tracking-wider uppercase">
                Daily Budget
              </span>
            </div>
            <div className="px-5 py-3 space-y-4">
              {dailyBudgets.map((db, idx) => {
                const isOver = (db.spent || 0) > (db.allocated || 0);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700">
                        Day {db.day}
                      </span>
                      <span
                        className={`text-xs ${isOver ? "text-red-500 font-medium" : "text-gray-500"}`}
                      >
                        Spent: ฿{(db.spent || 0).toLocaleString()} / Limit: ฿
                        {(db.allocated || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-emerald-400"}`}
                        style={{
                          width: `${Math.min(((db.spent || 0) / (db.allocated || 1)) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily avg limit</span>
              <span className="text-lg font-bold text-gray-900">
                ฿
                {Math.round(
                  totalAllocated / dailyBudgets.length,
                ).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* ── Expenses List ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              List of expenses
            </span>
            <button
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-medium transition-colors shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </button>
          </div>

          <AnimatePresence>
            {isAddingExpense && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-col gap-3">
                  <p className="text-sm font-bold text-gray-800 mb-1">
                    Add Expense
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      placeholder="Item name"
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        ฿
                      </span>
                      <input
                        type="number"
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <select
                      value={newExpCategoryId}
                      onChange={(e) => setNewExpCategoryId(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newExpDay}
                      onChange={(e) => setNewExpDay(e.target.value)}
                      className="w-28 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                    >
                      {Array.from({ length: Math.max(daysCount, 1) }).map(
                        (_, i) => (
                          <option key={i} value={i + 1}>
                            Day {i + 1}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={newExpNote}
                    onChange={(e) => setNewExpNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                  />

                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={() => setIsAddingExpense(false)}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newExpName || !newExpAmount || !newExpCategoryId)
                          return;
                        const newExpense = {
                          id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                          name: newExpName,
                          amount: Number(newExpAmount),
                          categoryId: newExpCategoryId,
                          day: Number(newExpDay),
                          note: newExpNote,
                        };

                        // 1. Update local state immediately for snappy UI (optimistic update)
                        const updatedLocalExpenses = [
                          ...localAddedExpenses,
                          newExpense,
                        ];
                        setLocalAddedExpenses(updatedLocalExpenses);

                        // 2. Trigger parent update to save to backend
                        if (onUpdateBudget && data) {
                          onUpdateBudget({
                            ...data,
                            expenses: [...(data.expenses || []), newExpense],
                          });
                        }

                        setIsAddingExpense(false);
                        setNewExpName("");
                        setNewExpAmount("");
                        setNewExpNote("");
                      }}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50"
                      disabled={
                        !newExpName || !newExpAmount || !newExpCategoryId
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            {allExpenses.length === 0 ? (
              <div className="py-8 text-center bg-white">
                <p className="text-sm text-gray-400">
                  There are no expense items yet.
                </p>
              </div>
            ) : (
              (() => {
                const groupedByDay = allExpenses.reduce<
                  Record<number, BudgetExpense[]>
                >((acc, exp) => {
                  const day = exp.day || 1;
                  if (!acc[day]) acc[day] = [];
                  acc[day].push(exp);
                  return acc;
                }, {});

                const sortedDays = Object.keys(groupedByDay)
                  .map(Number)
                  .sort((a, b) => a - b);

                return sortedDays.map((day) => (
                  <div key={day}>
                    <div className="px-5 py-2 bg-gray-50/80 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Day {day}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {groupedByDay[day].map((exp) => {
                        const info = getCatInfo(exp.categoryId);
                        const Icon = info.icon;
                        const catColor =
                          categories.find((c) => c.id === exp.categoryId)
                            ?.color ||
                          info.text.replace("text-", "#") + "00";
                        const catName =
                          categories.find((c) => c.id === exp.categoryId)
                            ?.name ||
                          info.text.replace("text-", "");

                        return (
                          <div
                            key={exp.id}
                            className="flex items-center px-5 py-3 hover:bg-gray-50/80 transition-colors group"
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mr-3"
                              style={{
                                backgroundColor: hexToRgba(catColor, 0.12),
                              }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: catColor }}
                              />
                            </div>
                            <div className="flex-1 min-w-0 mr-4">
                              <p className="text-sm font-semibold text-gray-800 break-words leading-snug">
                                {exp.name}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {catName}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <p className="text-sm font-bold text-gray-900 tabular-nums">
                                ฿{exp.amount.toLocaleString()}
                              </p>
                              <button
                                onClick={() => {
                                  const updatedExpenses = allExpenses.filter(
                                    (e) => e.id !== exp.id,
                                  );
                                  setLocalAddedExpenses(
                                    localAddedExpenses.filter(
                                      (e) => e.id !== exp.id,
                                    ),
                                  );

                                  if (onUpdateBudget && data) {
                                    onUpdateBudget({
                                      ...data,
                                      expenses: updatedExpenses,
                                    });
                                  }
                                }}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
          <div className="px-5 py-4 bg-gray-50/95 border-t border-gray-100 flex items-center justify-between sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <span className="text-sm text-gray-500">
              {allExpenses.length} expenses
            </span>
            <span className="text-sm font-bold text-gray-900">
              Total ฿
              {allExpenses
                .reduce((s, e) => s + (e.amount || 0), 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
