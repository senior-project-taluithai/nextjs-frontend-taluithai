# Complete Budget Plan UI in Frontend

Backend implementation is **100% complete** per the plan — supervisor architecture, Deep Agent validator, Redis cache, all post-processing functions, and budget JSON output are all in place.

Frontend is missing the budget visualization UI. The backend `budget_agent` outputs structured JSON with `categories[]`, but the frontend has no component to display it.

## Proposed Changes

### 1. Dependencies

#### [MODIFY] [package.json](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/package.json)

```bash
pnpm add recharts
```

Required for the pie chart and bar chart in the budget panel (same library used in the Redesign reference [TripCostPanel.tsx](file:///Users/tar/Documents/year4/Redesign_TaluiThai_UX_UI_V1/src/app/components/TripCostPanel.tsx)).

---

### 2. Budget Data Extraction

#### [MODIFY] [useAgentChat.ts](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/hooks/useAgentChat.ts)

- Add `BudgetCategory` type and `BudgetData` interface to match the new backend output format:
  ```typescript
  interface BudgetCategory {
    id: string; name: string; color: string; allocated: number; spent: number;
  }
  interface BudgetData {
    total: number; categories: BudgetCategory[];
  }
  ```
- Add `budgetData` state and expose it from the hook
- Add `extractBudgetFromMarkdown()` function that scans JSON code blocks for `{ total, categories: [...] }` shape
- Call it after stream completes alongside [extractTripFromMarkdown()](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/hooks/useAgentChat.ts#272-294)

---

### 3. Budget Panel Component

#### [NEW] [budget-panel.tsx](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/components/ai-planner/budget-panel.tsx)

Create a budget visualization component inspired by the Redesign reference [TripCostPanel.tsx](file:///Users/tar/Documents/year4/Redesign_TaluiThai_UX_UI_V1/src/app/components/TripCostPanel.tsx). Will include:

1. **Budget Overview Card** — total budget, total allocated, remaining/over-budget with animated progress bar
2. **Pie Chart** — category proportions (donut chart)  
3. **Category Quick-Stats Grid** — 6 category cards with icons, amounts, filterable
4. **Category List** — detailed list of allocations with color indicators

Icons from `lucide-react` (already installed), charts from `recharts` (to install), animations from `framer-motion` (already installed).

---

### 4. Integration

#### [MODIFY] [trip-result-panel.tsx](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/components/ai-planner/trip-result-panel.tsx)

- Update [BudgetBreakdown](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/components/ai-planner/trip-result-panel.tsx#22-29) interface to also accept the new `BudgetData` shape (with `categories`)
- Import and render `BudgetPanel` below the day itinerary list when `budgetData` is available
- Add a tab or section toggle between "Itinerary" and "Budget" views

#### [MODIFY] [page.tsx (ai-planner)](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/app/ai-planner/page.tsx)

- Extract `budgetData` from [useAgentChat()](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/hooks/useAgentChat.ts#106-271) hook
- Pass `budgetData` to [TripResultPanel](file:///Users/tar/Documents/year4/nextjs-frontend-taluithai/components/ai-planner/trip-result-panel.tsx#38-163)

---

## Verification Plan

### Automated Tests

```bash
cd /Users/tar/Documents/year4/nextjs-frontend-taluithai
pnpm run build   # TypeScript compilation + Next.js build check  
```

> [!NOTE]
> No existing unit tests found in the frontend project. Build verification ensures type safety and no broken imports.

### Manual Verification

1. **Start backend**: `cd /Users/tar/Documents/year4/nestjs-backend-taluithai && npm run start:dev`
2. **Start frontend**: `cd /Users/tar/Documents/year4/nextjs-frontend-taluithai && pnpm run dev`
3. **Navigate** to `/ai-planner` and send: `"วางแผนเที่ยวเชียงใหม่ 2 วัน งบ 5000 บาท"`
4. **Verify**: Budget panel appears in the left panel showing pie chart, category breakdown, progress bar
