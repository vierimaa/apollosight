import { test, expect } from '@playwright/test';

test.describe('Programs list (/programs)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/programs');
	});

	test('page heading and total stat card are visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Programs', exact: true })).toBeVisible();
		await expect(page.getByText('Total')).toBeVisible();
	});

	test('program cards are visible', async ({ page }) => {
		await expect(page.getByText('Workout Programs')).toBeVisible();
		await expect(page.locator('a[href^="/programs/"]').first()).toBeVisible();
	});

	test('search input is present and accessible', async ({ page }) => {
		const searchInput = page.getByPlaceholder('Search programs...');
		await expect(searchInput).toBeVisible();
		await expect(searchInput).toBeEnabled();
	});

	test('A-Z sort button is present and clickable', async ({ page }) => {
		const alphaBtn = page.getByRole('button', { name: 'A-Z' });
		await expect(alphaBtn).toBeVisible();
		await alphaBtn.click();
		await expect(alphaBtn).toBeVisible();
	});

	test('Recent sort button is present and clickable', async ({ page }) => {
		const recentBtn = page.getByRole('button', { name: 'Recent' });
		await expect(recentBtn).toBeVisible();
		await recentBtn.click();
		await expect(recentBtn).toBeVisible();
	});

	test('search filter input can be interacted with', async ({ page }) => {
		// Reactive filter behaviour is verified at the component level.
		// E2E verifies the input exists and accepts keyboard input without error.
		const searchInput = page.getByPlaceholder('Search programs...');
		await searchInput.click();
		await searchInput.pressSequentially('Treeni');
		await expect(searchInput).toHaveValue('Treeni');
	});

	test('clicking a program card navigates to program detail', async ({ page }) => {
		const firstCard = page.locator('a[href^="/programs/"]').first();
		await firstCard.click();
		await expect(page).toHaveURL(/\/programs\/.+/);
	});
});

test.describe('Program detail (/programs/[program])', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/programs');
		await page.locator('a[href^="/programs/"]').first().click();
		await page.waitForURL(/\/programs\/.+/);
	});

	test('renders four summary stat cards', async ({ page }) => {
		await expect(page.getByText('Sessions')).toBeVisible();
		await expect(page.getByText('All-Time Volume')).toBeVisible();
		await expect(page.getByText('Avg Volume / Session')).toBeVisible();
		await expect(page.getByText('Avg Duration')).toBeVisible();
	});

	test('all four chart sections are visible', async ({ page }) => {
		await expect(page.getByText('Volume per Session')).toBeVisible();
		await expect(page.getByText('Duration per Session')).toBeVisible();
		await expect(page.getByText('Sets per Session')).toBeVisible();
		await expect(page.getByText('Reps per Session')).toBeVisible();
	});

	test('session history table has at least one row', async ({ page }) => {
		await expect(page.getByText('Session History')).toBeVisible();
		await expect(page.locator('tbody tr').first()).toBeVisible();
	});

	test('session history rows link to workout detail', async ({ page }) => {
		const workoutLink = page.locator('tbody a[href^="/workouts/"]').first();
		await expect(workoutLink).toBeVisible();
		await workoutLink.click();
		await expect(page).toHaveURL(/\/workouts\/.+/);
	});

	test('Back to Programs link navigates to /programs', async ({ page }) => {
		await page.getByRole('link', { name: 'Back to Programs' }).click();
		await expect(page).toHaveURL('/programs');
	});
});
