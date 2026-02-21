# ApolloSight

A personal workout analytics dashboard built with **SvelteKit 5**, powered by [Hevy](https://hevy.com/) CSV exports. Track progress across exercises, visualize trends with interactive charts, and discover personal records at a glance.

## Features

- **Dashboard** – 5-stat overview (workouts, duration, exercises, streak, volume) with 2-week trend indicators, weekly frequency bar chart, recent PRs table, and recent workouts list
- **Exercise Library** – Browse all logged exercises with live search, sort by name or recency, and session counts
- **Exercise Progress** – Detailed charts (max weight, estimated 1RM, volume, reps) with time range filtering (4w, 3m, 6m, 9m, all)
- **Workouts** – Activity heatmap (GitHub-style), monthly volume & duration trends, reverse-chronological session list with filtering
- **Workout Detail** – Full breakdown by exercise, set-by-set data, prev/next navigation, links to exercise progress pages
- **Responsive UI** – Built with Skeleton UI v4 + Tailwind CSS v4 for mobile-friendly design
- **Type-Safe** – Full TypeScript support with Svelte 5 runes

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| **Framework** | SvelteKit + Svelte | 2.52 / 5.53 |
| **Styling** | Skeleton UI + Tailwind CSS | 4.12 / 4.0 |
| **Charts** | Chart.js | 4.5 |
| **Icons** | lucide-svelte | 0.564 |
| **Backend (dev)** | json-server | 1.0.0-beta.3 |
| **CSV parsing** | papaparse | 5.5.2 |
| **Testing (unit)** | vitest | 2.0.4 |
| **Testing (e2e)** | Playwright | 1.58.2 |
| **Language** | TypeScript | 5.0 |
| **Build** | Vite | 5.0.3 |

## Data Pipeline

The workflow is: **Hevy CSV** → **Transform** → **JSON** → **Backend** → **SvelteKit Frontend**

1. **Source**: Export workout data from the Hevy app as `workouts.csv`
2. **Transform** (`npm run transform`):
   - Parses CSV with headers (start_time, end_time, exercise_title, weight_kg, reps, etc.)
   - Converts dates to ISO 8601, calculates workout duration
   - Generates deterministic SHA-256 UUIDs per workout (based on start_time)
   - Groups flat rows into nested sessions → exercises → sets structure
   - Writes `sessionData.json` to project root
3. **Backend** (`npm run backend`):
   - json-server watches `sessionData.json`
   - Exposes REST endpoint: `http://localhost:3000/workouts`
4. **Frontend** (`npm run dev`):
   - All `+page.server.ts` load functions fetch from `$lib/api.ts` `API_BASE`
   - Renders data with interactive charts, tables, and filters

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm

### Setup

1. **Clone & install**
   ```bash
   git clone <repo>
   cd apollosight
   npm install
   ```

2. **Prepare data** – Place your `workouts.csv` in `scripts/`

3. **Transform data**
   ```bash
   npm run transform
   ```
   This generates `sessionData.json` at the project root.

4. **Start backend** (Terminal 1)
   ```bash
   npm run backend
   ```
   The API will be available at `http://localhost:3000`.

5. **Start frontend** (Terminal 2)
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

> **Note**: The backend must be running before the frontend, or all pages will error. You can override the API URL via the `API_URL` environment variable.

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start SvelteKit dev server (Vite) on port 5173 |
| `npm run backend` | Start json-server watching `sessionData.json` on port 3000 |
| `npm run build` | Build production bundle |
| `npm run preview` | Serve production build locally |
| `npm run check` | Run TypeScript & Svelte type checking |
| `npm run check:watch` | Type checking in watch mode |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Run unit tests (vitest) in watch mode |
| `npm run test` | Run unit tests once (CI mode) |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run test:e2e:ui` | Run e2e tests with interactive UI |
| `npm run transform` | Transform `scripts/workouts.csv` → `sessionData.json` |

## Project Structure

```
src/
├── routes/                     # SvelteKit pages
│   ├── +layout.svelte         # Root layout (AppShell)
│   ├── +page.server.ts        # Dashboard data loader
│   ├── +page.svelte           # Dashboard view
│   ├── exercises/
│   │   ├── +page.server.ts    # Exercise library data
│   │   ├── +page.svelte       # Exercise library view
│   │   └── [exercise]/
│   │       ├── +page.server.ts # Exercise detail data
│   │       └── +page.svelte   # Exercise detail view
│   └── workouts/
│       ├── +page.server.ts    # Workouts data
│       ├── +page.svelte       # Workouts view
│       └── [uuid]/
│           ├── +page.server.ts # Workout detail data
│           └── +page.svelte   # Workout detail view
│
├── lib/
│   ├── api.ts                 # API_BASE constant, env override
│   ├── types.ts               # Shared TypeScript interfaces
│   ├── index.ts               # Barrel exports
│   ├── components/
│   │   ├── cards/             # StatCard, SectionCard
│   │   ├── charts/            # LineChart, BarChart
│   │   ├── data/              # Badge, DataTable
│   │   ├── feedback/          # EmptyState, LoadingSkeleton
│   │   └── layout/            # AppShell, PageHeader, Sidebar
│   └── utils/
│       └── format.ts          # formatDate, formatDuration, slugify
│
└── app.html / app.css / app.d.ts

scripts/
├── transform-data.ts          # CSV → JSON pipeline
└── workouts.csv               # Input data (not in repo)

sessionData.json               # Generated output (not in repo)
```

## License

MIT
