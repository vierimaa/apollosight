import { test, expect } from '@playwright/test';

test.describe('Sidebar navigation', () => {
	test('Dashboard link is active on home page', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL('/');
		// Sidebar nav link for Dashboard is present and points to /
		const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
		await expect(dashboardLink).toBeVisible();
	});

	test('Clicking Workouts navigates to /workouts', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Workouts' }).click();
		await expect(page).toHaveURL('/workouts');
	});

	test('Clicking Exercises navigates to /exercises', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Exercises' }).click();
		await expect(page).toHaveURL('/exercises');
	});

	test('Clicking Stats navigates to /stats', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Stats' }).click();
		await expect(page).toHaveURL('/stats');
	});

	test('Clicking Dashboard from another page navigates back to /', async ({ page }) => {
		await page.goto('/workouts');
		await page.getByRole('link', { name: 'Dashboard' }).click();
		await expect(page).toHaveURL('/');
	});

	test('Sidebar is visible on all main routes', async ({ page }) => {
		for (const route of ['/', '/workouts', '/exercises', '/stats']) {
			await page.goto(route);
			await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Workouts' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Exercises' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Stats' })).toBeVisible();
		}
	});
});
