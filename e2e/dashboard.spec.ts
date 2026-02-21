import { test, expect } from '@playwright/test';

test.describe('Dashboard (/)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('renders all five stat cards', async ({ page }) => {
		await expect(page.getByText('Workouts (2 weeks)')).toBeVisible();
		await expect(page.getByText('Duration (2 weeks)')).toBeVisible();
		await expect(page.getByText('Exercises (2 weeks)')).toBeVisible();
		await expect(page.getByText('Current Streak')).toBeVisible();
		await expect(page.getByText('All-time Volume')).toBeVisible();
	});

	test('renders Weekly Training Frequency chart section', async ({ page }) => {
		await expect(page.getByText('Weekly Training Frequency')).toBeVisible();
		await expect(page.locator('canvas').first()).toBeVisible();
	});

	test('Recent Workouts table has at least one row', async ({ page }) => {
		await expect(page.getByText('Recent Workouts')).toBeVisible();
		// The page contains DataTables; at least one tbody row must be visible
		await expect(page.locator('tbody tr').first()).toBeVisible();
	});

	test('Recent Personal Bests table is visible', async ({ page }) => {
		await expect(page.getByText('Recent Personal Bests')).toBeVisible();
	});

	test('clicking a workout link in Recent Workouts navigates to workout detail', async ({
		page
	}) => {
		// Find a link to a workout detail page inside the page
		const workoutLink = page
			.locator('a[href^="/workouts/"]')
			.first();
		await expect(workoutLink).toBeVisible();
		await workoutLink.click();
		await expect(page).toHaveURL(/\/workouts\/.+/);
	});

	test('clicking an exercise link in Recent Personal Bests navigates to exercise detail', async ({
		page
	}) => {
		const exerciseLink = page.locator('a[href^="/exercises/"]').first();
		await expect(exerciseLink).toBeVisible();
		await exerciseLink.click();
		await expect(page).toHaveURL(/\/exercises\/.+/);
	});
});
