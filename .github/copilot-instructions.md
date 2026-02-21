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

## Svelte 5 Patterns (NOT Svelte 4!)

###  Use These Runes
```svelte
<script lang="ts">
  let { data } = $props();              // Props (NOT export let)
  let timeRange = $state('all');        // State (NOT let/const)

  const filtered = $derived(           // Computed value (NOT $:)
    data.filter(workout => new Date(workout.start_time) >= cutoff)
  );
</script>
```

###  Don't Use
- `export let` for props  Use `$props()`
- `$:` for reactivity  Use `$derived`
- `$derived(() => fn())`  Use `$derived(fn())`  the former creates a function, not a value
- Svelte stores (`writable`, `readable`)  Use `$state`
- Destructuring `data` directly  Use `$derived` to keep reactivity: `const workout = $derived(data.workout)`

## Component Patterns

### Barrel Exports
```typescript
// Always import from $lib barrel export
import { PageHeader, StatCard, SectionCard } from '$lib';
import type { WorkoutSession, ExerciseHistoryEntry } from '$lib';
// NOT: import PageHeader from '$lib/components/layout/PageHeader.svelte'
```

### Chart Lifecycle
```svelte
<script lang="ts">
  import { Chart, LineController, LineElement, PointElement,
           LinearScale, CategoryScale, Filler, Tooltip, Legend, Title } from 'chart.js';
  Chart.register(LineController, LineElement, PointElement,
                 LinearScale, CategoryScale, Filler, Tooltip, Legend, Title);

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const currentLabels = labels;
    const currentDatasets = datasets;

    if (canvas?.offsetWidth > 0) {
      buildChart(currentLabels, currentDatasets);
      return () => { chart?.destroy(); chart = undefined; };
    }

    // Hidden tab: wait for real dimensions
    const observer = new ResizeObserver(() => {
      if (canvas && canvas.offsetWidth > 0) {
        buildChart(currentLabels, currentDatasets);
        observer.disconnect();
      }
    });
    if (canvas) observer.observe(canvas);
    return () => { observer.disconnect(); chart?.destroy(); chart = undefined; };
  });
</script>
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

/** Exercise enriched with its parent workout's date. */
interface ExerciseHistoryEntry extends Exercise {
  workout_date: string;
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

The server matches using the same algorithm:
```typescript
exercise.exercise_title.replace(/\s+/g, '-').toLowerCase() === params.exercise
```

**Never reimplement slugify inline**  always import the shared function.

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

## Time Range Filtering Pattern

Standard across all exercise pages:

```typescript
let timeRange = $state<'4w' | '3m' | '6m' | '9m' | 'all'>('all');

const filterByTimeRange = (history: ExerciseHistoryEntry[]): ExerciseHistoryEntry[] => {
  if (timeRange === 'all') return history;
  const now = new Date();
  let cutoff: Date;
  if (timeRange === '4w') {
    cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '3m') {
    cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 3);
  } else if (timeRange === '6m') {
    cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 6);
  } else {
    // '9m'
    cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 9);
  }
  return history.filter((entry) => new Date(entry.workout_date) >= cutoff);
};

const filteredHistory = $derived(filterByTimeRange(exerciseHistory));
```

## Styling & UI

- **Framework**: Skeleton UI v4 + Tailwind v4
- **Icons**: lucide-svelte
- **Component prefix**: Skeleton components imported from `@skeletonlabs/skeleton-svelte`
- **Finnish locale**: Date formatting uses `'fi-FI'` by default

## File Organization
```
src/
 routes/               # SvelteKit routes
    +page.svelte     # Client component
    +page.server.ts  # Server data loading
    [param]/         # Dynamic routes
 lib/
    components/      # Organized by type (cards/, charts/, layout/, data/, feedback/)
    utils/           # format.ts (formatDate, formatDuration, slugify)
    api.ts           # API_BASE constant (overridable via API_URL env var)
    types.ts         # Shared TypeScript interfaces
    index.ts         # Barrel exports (components + types)
scripts/
 transform-data.ts    # CSV  JSON pipeline
```

## Common Pitfalls

1. **API URL**: Never hardcode `http://localhost:3000`  always import `API_BASE` from `$lib/api.ts`. Override the port via `API_URL` env var if needed.
2. **UUID generation**: UUIDs are SHA-256 of start_time, not random  don't change this.
3. **Chart cleanup**: Always destroy Chart.js instances and set `chart = undefined` in `$effect` cleanup. Use tree-shaken imports, not `chart.js/auto`.
4. **Date filtering**: Clone arrays before sort: `[...data].sort()` to avoid mutations.
5. **Slugify**: Always use the shared `slugify()` from `$lib/utils/format.ts`. Reimplementing it with different regex (e.g. `[^a-z0-9]+`) will produce different slugs and break links for exercises with parentheses.
6. **`$derived` destructuring**: Don't destructure `data` directly  it captures only the initial value. Use `const workout = $derived(data.workout)`.
