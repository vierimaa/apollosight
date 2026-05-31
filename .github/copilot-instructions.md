# ApolloSight - AI Coding Agent Instructions

## Project Overview
SvelteKit workout analytics app using **Svelte 5 runes**, Chart.js, and a direct JSON file backend.

## Critical Architecture

### Data Pipeline (Read All Steps)
1. **Source**: CSV workout data from Hevy app export (`scripts/workouts.csv`)
2. **Transform**: `npm run transform`  `scripts/transform-data.ts`
   - Groups CSV rows into workout sessions
   - Generates SHA-256 UUIDs from start_time
   - Outputs `sessionData.json` at project root
3. **Frontend**: `+page.server.ts` files call functions from `src/lib/db.ts` directly — no HTTP backend needed
   - `getWorkouts()` — returns all sessions (cached in memory after first read)
   - `getWorkoutByUuid(uuid)` — returns a single session or null
   - `getWorkoutsByTitle(title)` — returns all sessions with matching title
   - Override file path via `DATA_PATH` env variable

### Development Workflow
```bash
# Single terminal only
npm run dev

# Data transformation (when CSV changes)
npm run transform
```

**Note**: After replacing `sessionData.json` while the app is running, call `POST /api/reload` to refresh the in-memory cache without restarting.

### Validating Changes

After making any changes to routes, server load functions, or components, run the full e2e suite to confirm nothing is broken:

```bash
npm run test:e2e
```

All 82 tests must pass. The suite starts `npm run dev` automatically — no manual server setup needed.

## Code Style

- **Functions**: Always use arrow functions (`const fn = () => {}`). Never use `function` declarations.
- **Variables**: Always use descriptive names. No single-character variables (no `a`, `b`, `i`, `e`, `w`, etc.).
- **Loops**: Use `for...of` for iteration. Never use `.forEach()`.
- **Nullish coalescing**: Prefer `?? 0` over `|| 0` for numeric fallbacks.
- **Type imports**: Use `import type` for types to enable tree-shaking.

```typescript
//  Correct
const formatDate = (iso: string): string => new Date(iso).toLocaleString('fi-FI');
const sortedWorkouts = [...workouts].sort(
  (workoutA, workoutB) => new Date(workoutB.start_time).getTime() - new Date(workoutA.start_time).getTime()
);
for (const workout of workouts) { ... }

//  Wrong
function formatDate(iso) { ... }
workouts.forEach((w) => { ... });
const total = w.duration_seconds || 0;
```

## Data Types

All shared types live in `src/lib/types.ts` and are re-exported from `$lib`.

```typescript
// src/lib/types.ts
interface WorkoutSet {
  set_index: number;
  set_type: string;
  weight_kg: number;
  reps: number;
  rpe: number | null;
}

interface Exercise {
  exercise_title: string;
  exercise_notes: string | null;
  sets: WorkoutSet[];
}

interface WorkoutSession {
  uuid: string;           // SHA-256 hash of start_time
  title: string;
  start_time: string;     // ISO 8601
  end_time: string;
  duration_seconds: number | null;
  exercises: Exercise[];
}

/** Exercise enriched with its parent workout's date and UUID. */
interface ExerciseHistoryEntry extends Exercise {
  workout_date: string;
  workout_uuid: string;
}
```

**Never define these inline in components**  always import from `$lib`.

## Exercise URL Encoding

Exercise names are slugified using the shared `slugify()` utility from `$lib/utils/format.ts`:

```typescript
import { slugify } from '$lib/utils/format';
// "Chest Press (Machine)"  "chest-press-(machine)"
slugify(exercise.exercise_title);
```

The server also imports and uses the same function:
```typescript
import { slugify } from '$lib/utils/format';
if (slugify(exercise.exercise_title) === params.exercise) { ... }
```

**Never reimplement slugify inline**  always import the shared function. An inline reimplementation with different regex will silently break links for exercises with parentheses or special characters.

## Server Load Functions

Always follow this pattern in `+page.server.ts`:

```typescript
import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWorkouts } from '$lib/db';

export const load: PageServerLoad = ({ params }) => {
  try {
    const workouts = getWorkouts();
    // transform data...
    return { workouts };
  } catch (err) {
    if (isHttpError(err)) throw err; // re-throw SvelteKit errors (404 etc) unchanged
    console.error('Error:', err);
    throw error(500, 'Internal Server Error');
  }
};
```

**Key rules:**
- Import `getWorkouts` / `getWorkoutByUuid` / `getWorkoutsByTitle` from `$lib/db` — never fetch from an HTTP backend
- Load functions are synchronous (no `async`/`await` needed unless other async work is present)
- Always re-throw `isHttpError` errors so 404s are not swallowed as 500s

## Server vs Client Responsibility

**The golden rule: `+page.server.ts` owns logic, `+page.svelte` owns presentation.**

### What belongs in `+page.server.ts`
- All data fetching and HTTP error handling
- Data transformation, aggregation, and pre-computation (totals, bests, counts, derived metrics)
- Pre-sorting data so the client never needs to sort on every render
- Any calculation that does not depend on runtime UI state (user input, selected filters, toggle values)

```typescript
// ✅ Correct — compute on server, return ready-to-use values
const totalSessions = exerciseHistory.length;
const bestWeight = exerciseHistory.reduce((best, entry) => {
  return Math.max(best, ...entry.sets.map((set) => set.weight_kg));
}, 0);
exerciseHistory.sort(
  (entryA, entryB) => new Date(entryA.workout_date).getTime() - new Date(entryB.workout_date).getTime()
);
return { exerciseHistory, totalSessions, bestWeight };
```

### What belongs in `+page.svelte`
- Reactive UI state (`$state`): selected tab, filter value, sort toggle, time range
- Derived values that depend on that UI state (`$derived`): filtered/sliced subsets of server data
- Rendering and layout only — no business logic that could have been computed once on the server

```svelte
<!-- ✅ Correct — client only reacts to user-driven state -->
let timeRange = $state('all');
const filteredHistory = $derived(filterByTimeRange(data.exerciseHistory));

<!-- ❌ Wrong — aggregating over full dataset on every render -->
const totalVolume = $derived(
  data.exerciseHistory.reduce((t, e) => t + e.sets.reduce(...), 0)
);
```

## E2E Testing (Playwright)

### Svelte 5 `oninput` + `$derived` filter limitation

Playwright cannot reliably trigger Svelte 5's `oninput` handler via `fill()` or `pressSequentially()` in the test environment. This means live-search/filter inputs driven by `$state` + `$derived` **cannot be tested end-to-end** by asserting that the rendered list changes.

**Do not write tests like this** — they will fail even though the feature works in the browser:

```typescript
// ❌ Wrong — fill() does not reliably fire oninput in Playwright + Svelte 5
await page.getByPlaceholder('Search...').fill('zzzznotaprogram');
await expect(page.locator('a[href^="/programs/"]')).toHaveCount(0);
```

**Instead, test that the input exists and accepts keyboard input without error** — the reactive filtering behaviour is covered at the component level:

```typescript
// ✅ Correct
test('search filter input can be interacted with', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search programs...');
  await searchInput.click();
  await searchInput.pressSequentially('Treeni');
  await expect(searchInput).toHaveValue('Treeni');
});
```

### Strict mode heading selectors

`getByRole('heading', { name: 'X' })` matches **all** headings whose text contains `X` (e.g. both `<h1>Programs</h1>` and `<h2>Workout Programs</h2>`), causing a strict-mode violation. Always use `exact: true` when the page contains headings that are substrings of each other:

```typescript
// ❌ Wrong — matches h1 "Programs" AND h2 "Workout Programs"
page.getByRole('heading', { name: 'Programs' })

// ✅ Correct
page.getByRole('heading', { name: 'Programs', exact: true })
```

### Detail page navigation pattern

Never hardcode UUIDs or slugs in e2e tests. Always navigate to a detail page **via the list page**:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/programs');
  await page.locator('a[href^="/programs/"]').first().click();
  await page.waitForURL(/\/programs\/.+/);
});
```
