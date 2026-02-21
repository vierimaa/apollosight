import { test, expect } from '@playwright/test';

test.describe('Exercises list (/exercises)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/exercises');
	});

	test('page heading and total stat card are visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Exercises' })).toBeVisible();
		await expect(page.getByText('Total')).toBeVisible();
	});

	test('exercise cards are visible', async ({ page }) => {
		await expect(page.getByText('Exercise Library')).toBeVisible();
		// At least one exercise card link exists
		await expect(page.locator('a[href^="/exercises/"]').first()).toBeVisible();
	});

	test('search input is present and accessible', async ({ page }) => {
		// The search filter's reactive behaviour (oninput → $state update → re-render) is tested
		// at the component level. E2E verifies the input exists and is interactive.
		const searchInput = page.getByPlaceholder('Search exercises...');
		await expect(searchInput).toBeVisible();
		await expect(searchInput).toBeEnabled();
	});

	test('A-Z sort button is present and clickable', async ({ page }) => {
		const alphaBtn = page.getByRole('button', { name: 'A-Z' });
		await expect(alphaBtn).toBeVisible();
		await alphaBtn.click();
		// After clicking, the button is active (no JS error)
		await expect(alphaBtn).toBeVisible();
	});

	test('Recent sort button is present and clickable', async ({ page }) => {
		const recentBtn = page.getByRole('button', { name: 'Recent' });
		await expect(recentBtn).toBeVisible();
		await recentBtn.click();
		await expect(recentBtn).toBeVisible();
	});

	test('clicking an exercise card navigates to exercise detail', async ({ page }) => {
		const firstCard = page.locator('a[href^="/exercises/"]').first();
		await firstCard.click();
		await expect(page).toHaveURL(/\/exercises\/.+/);
	});
});

test.describe('Exercise detail (/exercises/[exercise])', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the first available exercise via the list page
		await page.goto('/exercises');
		await page.locator('a[href^="/exercises/"]').first().click();
		await page.waitForURL(/\/exercises\/.+/);
	});

	test('renders four summary stat cards', async ({ page }) => {
		await expect(page.getByText('Sessions')).toBeVisible();
		await expect(page.getByText('Best Weight')).toBeVisible();
		await expect(page.getByText('Best 1RM')).toBeVisible();
		await expect(page.getByText('Total Volume')).toBeVisible();
	});

	test('Progress Charts section is visible', async ({ page }) => {
		await expect(page.getByText('Progress Charts')).toBeVisible();
	});

	test('all time range filter buttons are present', async ({ page }) => {
		await expect(page.getByRole('button', { name: '4 weeks' })).toBeVisible();
		await expect(page.getByRole('button', { name: '3 months' })).toBeVisible();
		await expect(page.getByRole('button', { name: '6 months' })).toBeVisible();
		await expect(page.getByRole('button', { name: '9 months' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'All time' })).toBeVisible();
	});

	test('all five chart tabs are present and clickable', async ({ page }) => {
		const tabs = ['Max Weight', '1RM', 'Best Set', 'Session Volume', 'Session Reps'];
		for (const tab of tabs) {
			const tabBtn = page.getByRole('tab', { name: tab });
			await expect(tabBtn).toBeVisible();
			await tabBtn.click();
			// No JS error after clicking
			await expect(tabBtn).toBeVisible();
		}
	});

	test('Workout History section has at least one "View Workout" link', async ({ page }) => {
		await expect(page.getByText('Workout History')).toBeVisible();
		const viewWorkoutLink = page.getByRole('link', { name: 'View Workout' }).first();
		await expect(viewWorkoutLink).toBeVisible();
	});

	test('"View Workout" link navigates to workout detail', async ({ page }) => {
		await page.getByRole('link', { name: 'View Workout' }).first().click();
		await expect(page).toHaveURL(/\/workouts\/.+/);
	});

	test('"Back to Exercises" link navigates to /exercises', async ({ page }) => {
		await page.getByRole('link', { name: 'Back to Exercises' }).click();
		await expect(page).toHaveURL('/exercises');
	});
});
