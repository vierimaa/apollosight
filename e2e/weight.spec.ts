import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The weight page SSR-redirects to /auth/fatsecret when
 * FATSECRET_ACCESS_TOKEN / FATSECRET_ACCESS_SECRET are not configured.
 * Two suites cover each scenario; each guards itself with test.skip when
 * the environment does not match.
 */

test.describe('Weight (/weight)', () => {
	// Run serially to avoid hammering the FatSecret API in parallel (13 month calls per load).
	test.describe.configure({ mode: 'serial' });

	let sharedPage: Page;

	test.beforeAll(async ({ browser }) => {
		sharedPage = await browser.newPage();
		await sharedPage.goto('/weight');
		// Wait for the 13 parallel FatSecret month requests to complete.
		await sharedPage.waitForLoadState('networkidle');
	});

	test.afterAll(async () => {
		await sharedPage.close();
	});

	test.beforeEach(async () => {
		test.skip(
			new URL(sharedPage.url()).pathname !== '/weight',
			'FatSecret credentials not configured — skipping authenticated weight tests'
		);
		// Skip data-dependent tests when no weight entries exist
		const hasNoData = await sharedPage.getByText('No weight entries found').isVisible();
		test.skip(hasNoData, 'No weight data available — skipping data-dependent tests');
	});

	test('page heading is visible', async () => {
		await expect(sharedPage.getByRole('heading', { name: 'Weight', exact: true })).toBeVisible();
	});

	test('date range picker is visible with From and To inputs', async () => {
		await expect(sharedPage.locator('label[for="start-date"]')).toBeVisible();
		await expect(sharedPage.locator('label[for="end-date"]')).toBeVisible();
		await expect(sharedPage.locator('#start-date')).toBeVisible();
		await expect(sharedPage.locator('#end-date')).toBeVisible();
	});

	test('date range inputs are enabled and accept input', async () => {
		await expect(sharedPage.locator('#start-date')).toBeEnabled();
		await expect(sharedPage.locator('#end-date')).toBeEnabled();
	});

	test('entry count label is visible', async () => {
		// Target the span in the date range toolbar (not the "Change (N entries)" stat card subtitle)
		await expect(sharedPage.locator('span.ml-auto').filter({ hasText: /\d+ entr(y|ies)/ })).toBeVisible();
	});

	test('four stat cards are visible', async () => {
		await expect(sharedPage.getByText('Current Weight')).toBeVisible();
		await expect(sharedPage.getByText('Lowest')).toBeVisible();
		await expect(sharedPage.getByText('Highest')).toBeVisible();
		// "Change" appears as part of e.g. "Change (42 entries)" — use regex
		await expect(sharedPage.getByText(/^Change/)).toBeVisible();
	});

	test('Rate of Change section is visible with all three period cards', async () => {
		await expect(sharedPage.getByText('Rate of Change')).toBeVisible();
		await expect(sharedPage.getByText('Selected period')).toBeVisible();
		await expect(sharedPage.getByText('Last 7 days')).toBeVisible();
		await expect(sharedPage.getByText('Last 30 days')).toBeVisible();
	});

	test('Weight Over Time chart section is visible', async () => {
		await expect(sharedPage.getByText('Weight Over Time')).toBeVisible();
	});
});
