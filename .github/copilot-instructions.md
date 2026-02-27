# ApolloSight - AI Coding Agent Instructions

## Project Overview
SvelteKit workout analytics app using **Svelte 5 runes**, Chart.js, and json-server backend.

## Critical Architecture

### Data Pipeline (Read All Steps)
1. **Source**: CSV workout data from Hevy app export (`scripts/workouts.csv`)
2. **Transform**: `npm run transform`  `scripts/transform-data.ts`
   - Groups CSV rows into workout sessions
   - Generates SHA-256 UUIDs from start_time
   - Outputs `sessionData.json` at project root
3. **Backend**: `npm run backend`  json-server on port 3000
4. **Frontend**: Fetches from `API_BASE` (defined in `src/lib/api.ts`) in `+page.server.ts` files

### Development Workflow
```bash
# Terminal 1: Backend (MUST run first)
npm run backend

# Terminal 2: Frontend
npm run dev

# Data transformation (when CSV changes)
npm run transform
```

**Critical**: Backend must be running before frontend, or all pages will error.

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
import { API_BASE } from '$lib/api';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const response = await fetch(`${API_BASE}/workouts`);
    if (!response.ok) throw error(response.status, response.statusText);
    const workouts = await response.json();
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
- Import `API_BASE` from `$lib/api.ts`  never hardcode `http://localhost:3000`
- Always check `response.ok` before calling `.json()`
- Always re-throw `isHttpError` errors so 404s are not swallowed as 500s
- For loads without try/catch, still check `response.ok` and throw appropriately

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
