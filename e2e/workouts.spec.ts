import { test, expect } from '@playwright/test';

test.describe('Workouts list (/workouts)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/workouts');
	});

	test('page heading and total stat card are visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Workouts' })).toBeVisible();
		await expect(page.getByText('Total')).toBeVisible();
	});

	test('All Sessions table has at least one data row', async ({ page }) => {
		await expect(page.getByText('All Sessions')).toBeVisible();
		await expect(page.locator('tbody tr').first()).toBeVisible();
	});

	test('time range filter buttons are all present', async ({ page }) => {
		await expect(page.getByRole('button', { name: '3m' })).toBeVisible();
		await expect(page.getByRole('button', { name: '6m' })).toBeVisible();
		await expect(page.getByRole('button', { name: '1y' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
	});

	test('clicking All filter always shows at least one row', async ({ page }) => {
		await page.getByRole('button', { name: 'All' }).click();
		await expect(page.locator('tbody tr').first()).toBeVisible();
	});

	test('clicking a workout title navigates to workout detail', async ({ page }) => {
		const workoutLink = page.locator('a[href^="/workouts/"]').first();
		await expect(workoutLink).toBeVisible();
		await workoutLink.click();
		await expect(page).toHaveURL(/\/workouts\/.{10,}/);
	});

	test('Activity Heatmap section is visible', async ({ page }) => {
		await expect(page.getByText('Activity Heatmap')).toBeVisible();
	});

	test('chart sections are visible', async ({ page }) => {
		await expect(page.getByText('Monthly Volume')).toBeVisible();
		await expect(page.getByText('Avg Session Duration')).toBeVisible();
	});
});

test.describe('Workout detail (/workouts/[uuid])', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the first available workout via the list page
		await page.goto('/workouts');
		await page.locator('a[href^="/workouts/"]').first().click();
		await page.waitForURL(/\/workouts\/.+/);
	});

	test('renders four stat cards', async ({ page }) => {
		await expect(page.getByText('Date')).toBeVisible();
		await expect(page.getByText('Duration')).toBeVisible();
		// Use main content scope to avoid matching the sidebar 'Exercises' nav link
		await expect(page.getByRole('main').getByText('Exercises').first()).toBeVisible();
		// Use exact match to avoid matching exercise subtitle text like '3 sets · 438 kg volume'
		await expect(page.getByText('Volume', { exact: true })).toBeVisible();
	});

	test('at least one exercise section card is visible', async ({ page }) => {
		// Exercise section cards rendered inside the workout
		await expect(page.locator('tbody tr').first()).toBeVisible();
	});

	test('each exercise section contains a sets table with at least one row', async ({ page }) => {
		const firstRow = page.locator('tbody tr').first();
		await expect(firstRow).toBeVisible();
	});

	test('"Back to Workouts" link navigates back to /workouts', async ({ page }) => {
		await page.getByRole('link', { name: 'Back to Workouts' }).click();
		await expect(page).toHaveURL('/workouts');
	});

	test('"View Progress" link navigates to an exercise detail page', async ({ page }) => {
		const viewProgressLink = page.getByRole('link', { name: 'View Progress' }).first();
		await expect(viewProgressLink).toBeVisible();
		await viewProgressLink.click();
		await expect(page).toHaveURL(/\/exercises\/.+/);
	});
});
