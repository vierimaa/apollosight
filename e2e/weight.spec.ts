import { test, expect } from '@playwright/test';

/**
 * The weight page SSR-redirects to /auth/fatsecret when
 * FATSECRET_ACCESS_TOKEN / FATSECRET_ACCESS_SECRET are not configured.
 * Two suites cover each scenario; each guards itself with test.skip when
 * the environment does not match.
 */

test.describe('Weight (/weight)', () => {
	// Run serially to avoid hammering the FatSecret API in parallel (13 month calls per load).
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page }) => {
		await page.goto('/weight');
		// Wait for the 13 parallel FatSecret month requests to complete.
		await page.waitForLoadState('networkidle');
		test.skip(
			new URL(page.url()).pathname !== '/weight',
			'FatSecret credentials not configured — skipping authenticated weight tests'
		);
		// Skip data-dependent tests when no weight entries exist
		const hasNoData = await page.getByText('No weight entries found').isVisible();
		test.skip(hasNoData, 'No weight data available — skipping data-dependent tests');
	});

	test('page heading is visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Weight', exact: true })).toBeVisible();
	});

	test('date range picker is visible with From and To inputs', async ({ page }) => {
		await expect(page.locator('label[for="start-date"]')).toBeVisible();
		await expect(page.locator('label[for="end-date"]')).toBeVisible();
		await expect(page.locator('#start-date')).toBeVisible();
		await expect(page.locator('#end-date')).toBeVisible();
	});

	test('date range inputs are enabled and accept input', async ({ page }) => {
		await expect(page.locator('#start-date')).toBeEnabled();
		await expect(page.locator('#end-date')).toBeEnabled();
	});

	test('entry count label is visible', async ({ page }) => {
		// Target the span in the date range toolbar (not the "Change (N entries)" stat card subtitle)
		await expect(page.locator('span.ml-auto').filter({ hasText: /\d+ entr(y|ies)/ })).toBeVisible();
	});

	test('four stat cards are visible', async ({ page }) => {
		await expect(page.getByText('Current Weight')).toBeVisible();
		await expect(page.getByText('Lowest')).toBeVisible();
		await expect(page.getByText('Highest')).toBeVisible();
		// "Change" appears as part of e.g. "Change (42 entries)" — use regex
		await expect(page.getByText(/^Change/)).toBeVisible();
	});

	test('Rate of Change section is visible with all three period cards', async ({ page }) => {
		await expect(page.getByText('Rate of Change')).toBeVisible();
		await expect(page.getByText('Selected period')).toBeVisible();
		await expect(page.getByText('Last 7 days')).toBeVisible();
		await expect(page.getByText('Last 30 days')).toBeVisible();
	});

	test('Weight Over Time chart section is visible', async ({ page }) => {
		await expect(page.getByText('Weight Over Time')).toBeVisible();
	});
});
