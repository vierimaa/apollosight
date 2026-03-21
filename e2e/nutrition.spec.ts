import { test, expect } from '@playwright/test';

/**
 * The nutrition page SSR-redirects to /auth/fatsecret when
 * FATSECRET_ACCESS_TOKEN / FATSECRET_ACCESS_SECRET are not configured.
 * Two suites cover each scenario; each guards itself with test.skip when
 * the environment does not match.
 */

test.describe('Nutrition (/nutrition)', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page }) => {
		await page.goto('/nutrition');
		test.skip(
			new URL(page.url()).pathname !== '/nutrition',
			'FatSecret credentials not configured — skipping authenticated nutrition tests'
		);
		// Skip data-dependent tests when no nutrition entries exist
		const hasNoData = await page.getByText('No nutrition entries found').isVisible();
		test.skip(hasNoData, 'No nutrition data available — skipping data-dependent tests');
	});

	test('page heading is visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Nutrition', exact: true })).toBeVisible();
	});

	test('date range picker is visible with From and To inputs', async ({ page }) => {
		// Check the From/To labels (more reliable than the icon+span container)
		await expect(page.locator('label[for="start-date"]')).toBeVisible();
		await expect(page.locator('label[for="end-date"]')).toBeVisible();
		await expect(page.locator('#start-date')).toBeVisible();
		await expect(page.locator('#end-date')).toBeVisible();
	});

	test('"days tracked" label is visible', async ({ page }) => {
		// Svelte renders filteredTotalDays and "days tracked" as separate text nodes
		// separated by a newline in the template, so use \s+ to match the whitespace.
		await expect(page.getByText(/\d+\s+days? tracked/)).toBeVisible();
	});

	test('date range inputs are enabled and accept input', async ({ page }) => {
		await expect(page.locator('#start-date')).toBeEnabled();
		await expect(page.locator('#end-date')).toBeEnabled();
	});

	test('four average stat cards are visible', async ({ page }) => {
		await expect(page.getByText('Avg Daily Calories')).toBeVisible();
		await expect(page.getByText('Avg Protein')).toBeVisible();
		await expect(page.getByText('Avg Carbohydrates')).toBeVisible();
		await expect(page.getByText('Avg Fat')).toBeVisible();
	});

	test('Macro Distribution section shows all three macros', async ({ page }) => {
		await expect(page.getByText('Macro Distribution (avg)')).toBeVisible();
		// Each macro label appears in the distribution bars
		await expect(page.getByText('Protein').first()).toBeVisible();
		await expect(page.getByText('Carbohydrates').first()).toBeVisible();
		await expect(page.getByText('Fat').first()).toBeVisible();
	});

	test('Calorie Range card shows highest and lowest day labels', async ({ page }) => {
		await expect(page.getByText('Calorie Range')).toBeVisible();
		await expect(page.getByText('Highest day')).toBeVisible();
		await expect(page.getByText('Lowest day')).toBeVisible();
	});

	test('chart sections are visible', async ({ page }) => {
		await expect(page.getByText('Daily Calories by Macro')).toBeVisible();
		await expect(page.getByText('Daily Macros (g)')).toBeVisible();
	});
});
