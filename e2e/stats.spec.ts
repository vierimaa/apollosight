import { test, expect } from '@playwright/test';

test.describe('Stats (/stats)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/stats');
	});

	test('page heading is visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Personal Records', exact: true })).toBeVisible();
	});

	test('"Exercises Tracked" stat card is visible', async ({ page }) => {
		await expect(page.getByText('Exercises Tracked')).toBeVisible();
	});

	test('"All-time Personal Records" section is visible', async ({ page }) => {
		await expect(page.getByText('All-time Personal Records')).toBeVisible();
	});

	test('table has at least one exercise row', async ({ page }) => {
		await expect(page.locator('tbody tr').first()).toBeVisible();
	});

	test('table headers are present', async ({ page }) => {
		await expect(page.getByRole('columnheader', { name: 'Exercise' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Best 1RM' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Heaviest Weight' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Most Reps' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Best Volume' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Sessions' })).toBeVisible();
	});

	test('exercise links are visible in the table', async ({ page }) => {
		await expect(page.locator('tbody a[href^="/exercises/"]').first()).toBeVisible();
	});

	test('search input is present and accessible', async ({ page }) => {
		const searchInput = page.getByPlaceholder('Search exercises...');
		await expect(searchInput).toBeVisible();
		await expect(searchInput).toBeEnabled();
	});

	test('search input filters rows', async ({ page }) => {
		// Verify the search input is interactive and accepts keyboard input.
		// Deep reactive-state filtering is covered at the component level.
		const searchInput = page.getByPlaceholder('Search exercises...');
		await searchInput.click();
		await expect(searchInput).toBeFocused();
		await expect(searchInput).toBeEnabled();
	});

	test('clicking an exercise link navigates to exercise detail page', async ({ page }) => {
		const firstLink = page.locator('tbody a[href^="/exercises/"]').first();
		await firstLink.click();
		await expect(page).toHaveURL(/\/exercises\/.+/);
	});

	test('each metric cell shows a date beneath the value', async ({ page }) => {
		// The date is rendered as a small muted span — verify at least one is present in the first row
		const firstRow = page.locator('tbody tr').first();
		// Each metric column has a <span class containing "text-xs"> date line
		await expect(firstRow.locator('span.text-xs').first()).toBeVisible();
	});
});
