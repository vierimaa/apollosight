import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Insights (/insights)', () => {
	test.describe.configure({ mode: 'serial' });

	let sharedPage: Page;

	test.beforeAll(async ({ browser }) => {
		sharedPage = await browser.newPage();
		await sharedPage.goto('/insights');
	});

	test.afterAll(async () => {
		await sharedPage.close();
	});

	test.beforeEach(async () => {
		test.skip(
			new URL(sharedPage.url()).pathname !== '/insights',
			'FatSecret credentials not configured — skipping authenticated insights tests'
		);
		// Skip data-dependent tests when no combined weight+nutrition data exists
		const hasNoData = await sharedPage.getByText('No data found').isVisible();
		test.skip(hasNoData, 'No insights data available — skipping data-dependent tests');
	});

	test('page heading is visible', async () => {
		await expect(sharedPage.getByRole('heading', { name: 'Insights', exact: true })).toBeVisible();
	});

	test('date range picker is visible with From and To inputs', async () => {
		await expect(sharedPage.locator('label[for="start-date"]')).toBeVisible();
		await expect(sharedPage.locator('label[for="end-date"]')).toBeVisible();
		await expect(sharedPage.locator('#start-date')).toBeVisible();
		await expect(sharedPage.locator('#end-date')).toBeVisible();
	});

	test('"days tracked" label is visible', async () => {
		await expect(sharedPage.getByText(/\d+\s+days? tracked/)).toBeVisible();
	});

	test('date range inputs are enabled and accept input', async () => {
		const startInput = sharedPage.locator('#start-date');
		const endInput = sharedPage.locator('#end-date');
		await expect(startInput).toBeEnabled();
		await expect(endInput).toBeEnabled();
		await startInput.click();
		await startInput.pressSequentially('2026');
		await expect(startInput).toBeEnabled();
	});

	test('four stat cards are visible', async () => {
		await expect(sharedPage.getByText('Weight Change')).toBeVisible();
		await expect(sharedPage.getByText('Avg Daily Calories')).toBeVisible();
		await expect(sharedPage.getByText('Avg Protein')).toBeVisible();
		await expect(sharedPage.getByText('Rate of Change')).toBeVisible();
	});

	test('Current Phase section is visible', async () => {
		await expect(sharedPage.getByText('Current Phase')).toBeVisible();
	});

	test('chart sections are visible', async () => {
		await expect(sharedPage.getByRole('heading', { name: 'Weight Trend', exact: true })).toBeVisible();
		await expect(sharedPage.getByRole('heading', { name: 'Daily Calories', exact: true })).toBeVisible();
	});
});
