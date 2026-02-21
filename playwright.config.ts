import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 10_000,
	retries: process.env.CI ? 1 : 0,
	fullyParallel: true,
	reporter: 'list',

	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],

	webServer: [
		{
			command: 'npm run backend',
			url: 'http://localhost:3000/workouts',
			reuseExistingServer: !process.env.CI,
			timeout: 10_000,
		},
		{
			command: 'npm run dev',
			url: 'http://localhost:5173',
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
		},
	],
});
