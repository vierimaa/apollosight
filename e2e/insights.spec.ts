import { test, expect } from '@playwright/test';

test.describe('Insights (/insights)', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page }) => {
		await page.goto('/insights');
		test.skip(
			new URL(page.url()).pathname !== '/insights',
			'FatSecret credentials not configured — skipping authenticated insights tests'
		);
		// Skip data-dependent tests when no combined weight+nutrition data exists
		const hasNoData = await page.getByText('No data found').isVisible();
		test.skip(hasNoData, 'No insights data available — skipping data-dependent tests');
	});

	test('page heading is visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Insights', exact: true })).toBeVisible();
	});

	test('date range picker is visible with From and To inputs', async ({ page }) => {
		await expect(page.locator('label[for="start-date"]')).toBeVisible();
		await expect(page.locator('label[for="end-date"]')).toBeVisible();
		await expect(page.locator('#start-date')).toBeVisible();
		await expect(page.locator('#end-date')).toBeVisible();
	});

	test('"days tracked" label is visible', async ({ page }) => {
		await expect(page.getByText(/\d+\s+days? tracked/)).toBeVisible();
	});

	test('date range inputs are enabled and accept input', async ({ page }) => {
		const startInput = page.locator('#start-date');
		const endInput = page.locator('#end-date');
		await expect(startInput).toBeEnabled();
		await expect(endInput).toBeEnabled();
		await startInput.click();
		await startInput.pressSequentially('2026');
		await expect(startInput).toBeEnabled();
	});

	test('four stat cards are visible', async ({ page }) => {
		await expect(page.getByText('Weight Change')).toBeVisible();
		await expect(page.getByText('Avg Daily Calories')).toBeVisible();
		await expect(page.getByText('Avg Protein')).toBeVisible();
		await expect(page.getByText('Rate of Change')).toBeVisible();
	});

	test('Current Phase section is visible', async ({ page }) => {
		await expect(page.getByText('Current Phase')).toBeVisible();
	});

	test('chart sections are visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Weight Trend', exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Daily Calories', exact: true })).toBeVisible();
	});
});
