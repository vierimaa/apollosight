# Gym View - AI Coding Agent Instructions

## Project Overview
SvelteKit workout analytics app using **Svelte 5 runes**, Chart.js, and json-server backend.

## Critical Architecture

### Data Pipeline (Read All Steps)
1. **Source**: CSV workout data from Hevy app export (`scripts/workouts.csv`)
2. **Transform**: `npm run transform` → `scripts/transform-data.ts`
   - Groups CSV rows into workout sessions
   - Generates SHA-256 UUIDs from start_time
   - Outputs `sessionData.json` at project root
3. **Backend**: `npm run backend` → json-server on port 3000
4. **Frontend**: Fetches from `http://localhost:3000/workouts` in `+page.server.ts` files

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

## Svelte 5 Patterns (NOT Svelte 4!)

### ✅ Use These Runes
```svelte
<script lang="ts">
  let { data } = $props();           // Props (NOT export let)
  let timeRange = $state('all');     // State (NOT let/const)
  
  const filtered = $derived(         // Computed (NOT $:)
    data.filter(w => new Date(w.start_time) >= cutoff)
  );
</script>
```

### ❌ Don't Use
- `export let` for props → Use `$props()`
- `$:` for reactivity → Use `$derived`
- Svelte stores (`writable`, `readable`) → Use `$state`

## Component Patterns

### Barrel Exports
```typescript
// Always import from $lib barrel export
import { PageHeader, StatCard, SectionCard } from '$lib';
// NOT: import PageHeader from '$lib/components/layout/PageHeader.svelte'
```

### Chart Lifecycle
```svelte
<script lang="ts">
  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;
  
  $effect(() => {
    // Create chart
    if (canvas && !chart) createChart();
    // Cleanup on unmount
    return () => chart?.destroy();
  });
</script>
```

## Data Types & URL Encoding

### Core Types (Match transform-data.ts)
```typescript
interface WorkoutSession {
  uuid: string;           // SHA-256 hash of start_time
  title: string;
  start_time: string;     // ISO 8601
  end_time: string;
  duration_seconds: number | null;
  exercises: Exercise[];
}
```

### Exercise URL Encoding
Exercise names are converted: `"Chest Press (Machine)"` → `"chest-press-(machine)"`
```typescript
// Encode: exercise.exercise_title.replace(/\s+/g, '-').toLowerCase()
// Match in server: exercise_title.replace(/\s+/g, '-').toLowerCase() === params.exercise
```

## Server Load Functions

Always follow this pattern in `+page.server.ts`:
```typescript
export const load: PageServerLoad = async ({ params }) => {
  try {
    const response = await fetch("http://localhost:3000/workouts");
    if (!response.ok) throw error(response.status, response.statusText);
    const workouts = await response.json();
    // Transform data...
    return { workouts };
  } catch (err) {
    console.error("Error:", err);
    throw error(500, "Internal Server Error");
  }
};
```

## Time Range Filtering Pattern
Standard across all exercise pages:
```typescript
let timeRange = $state<'4w' | '3m' | '6m' | '9m' | 'all'>('all');

function filterByTimeRange(history: any) {
  if (timeRange === 'all') return history;
  const cutoff = timeRange === '4w' 
    ? new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    : /* calculate months */;
  return history.filter(e => new Date(e.workout_date) >= cutoff);
}
```

## Styling & UI

- **Framework**: Skeleton UI v4 + Tailwind v4
- **Icons**: lucide-svelte
- **Component prefix**: Skeleton components imported from `@skeletonlabs/skeleton-svelte`
- **Finnish locale**: Date formatting uses `'fi-FI'` by default

## File Organization
```
src/
├── routes/               # SvelteKit routes
│   ├── +page.svelte     # Client component
│   ├── +page.server.ts  # Server data loading
│   └── [param]/         # Dynamic routes
├── lib/
│   ├── components/      # Organized by type (cards/, charts/, layout/)
│   ├── utils/           # format.ts (formatDate, formatDuration)
│   └── index.ts         # Barrel exports
scripts/
└── transform-data.ts    # CSV → JSON pipeline
```

## Common Pitfalls

1. **Port conflicts**: json-server MUST be on port 3000 (hardcoded in server loads)
2. **UUID generation**: UUIDs are SHA-256 of start_time, not random - don't change this
3. **Chart cleanup**: Always destroy Chart.js instances in $effect cleanup
4. **Date filtering**: Clone arrays before sort: `[...data].sort()` to avoid mutations
5. **Type imports**: Use `import type` for types to enable tree-shaking

## Additional Context Files
- `.github/copilot/overview.prompt` - Project overview
- `.github/copilot/types.prompt` - Complete type definitions
- `.github/copilot/routes.prompt` - Route structure and navigation
