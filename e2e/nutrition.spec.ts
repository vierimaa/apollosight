import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The nutrition page SSR-redirects to /auth/fatsecret when
 * FATSECRET_ACCESS_TOKEN / FATSECRET_ACCESS_SECRET are not configured.
 * Two suites cover each scenario; each guards itself with test.skip when
 * the environment does not match.
 */

test.describe('Nutrition (/nutrition)', () => {
	test.describe.configure({ mode: 'serial' });

	let sharedPage: Page;

	test.beforeAll(async ({ browser }) => {
		sharedPage = await browser.newPage();
		await sharedPage.goto('/nutrition');
	});

	test.afterAll(async () => {
		await sharedPage.close();
	});

	test.beforeEach(async () => {
		test.skip(
			new URL(sharedPage.url()).pathname !== '/nutrition',
			'FatSecret credentials not configured — skipping authenticated nutrition tests'
		);
		// Skip data-dependent tests when no nutrition entries exist
		const hasNoData = await sharedPage.getByText('No nutrition entries found').isVisible();
		test.skip(hasNoData, 'No nutrition data available — skipping data-dependent tests');
	});

	test('page heading is visible', async () => {
		await expect(sharedPage.getByRole('heading', { name: 'Nutrition', exact: true })).toBeVisible();
	});

	test('date range picker is visible with From and To inputs', async () => {
		// Check the From/To labels (more reliable than the icon+span container)
		await expect(sharedPage.locator('label[for="start-date"]')).toBeVisible();
		await expect(sharedPage.locator('label[for="end-date"]')).toBeVisible();
		await expect(sharedPage.locator('#start-date')).toBeVisible();
		await expect(sharedPage.locator('#end-date')).toBeVisible();
	});

	test('"days tracked" label is visible', async () => {
		// Svelte renders filteredTotalDays and "days tracked" as separate text nodes
		// separated by a newline in the template, so use \s+ to match the whitespace.
		await expect(sharedPage.getByText(/\d+\s+days? tracked/)).toBeVisible();
	});

	test('date range inputs are enabled and accept input', async () => {
		await expect(sharedPage.locator('#start-date')).toBeEnabled();
		await expect(sharedPage.locator('#end-date')).toBeEnabled();
	});

	test('four average stat cards are visible', async () => {
		await expect(sharedPage.getByText('Avg Daily Calories')).toBeVisible();
		await expect(sharedPage.getByText('Avg Protein')).toBeVisible();
		await expect(sharedPage.getByText('Avg Carbohydrates')).toBeVisible();
		await expect(sharedPage.getByText('Avg Fat')).toBeVisible();
	});

	test('Macro Distribution section shows all three macros', async () => {
		await expect(sharedPage.getByText('Macro Distribution (avg)')).toBeVisible();
		// Each macro label appears in the distribution bars
		await expect(sharedPage.getByText('Protein').first()).toBeVisible();
		await expect(sharedPage.getByText('Carbohydrates').first()).toBeVisible();
		await expect(sharedPage.getByText('Fat').first()).toBeVisible();
	});

	test('Calorie Range card shows highest and lowest day labels', async () => {
		await expect(sharedPage.getByText('Calorie Range')).toBeVisible();
		await expect(sharedPage.getByText('Highest day')).toBeVisible();
		await expect(sharedPage.getByText('Lowest day')).toBeVisible();
	});

	test('chart sections are visible', async () => {
		await expect(sharedPage.getByText('Daily Calories by Macro')).toBeVisible();
		await expect(sharedPage.getByText('Daily Macros (g)')).toBeVisible();
	});
});
