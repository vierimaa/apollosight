# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Data Transformation

The project includes a data transformation script that processes workout data from CSV to JSON format. The script is located in `scripts/transform-data.ts`.

### What the script does:

1. Reads workout data from `workouts.csv`
2. Transforms the data:
   - Converts dates to ISO 8601 format
   - Calculates workout durations
   - Generates UUIDs for each workout
   - Groups workouts into sessions with exercises and sets
3. Outputs one JSON file in the `static` directory:
   - `sessionData.json`: Grouped workout sessions

### Running the script:

```bash
# Install dependencies
npm install

# Run the transformation script
npm run transform
```

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open

# Setup backend using json-server
npx json-server --watch sessionData.json --port 3000
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
