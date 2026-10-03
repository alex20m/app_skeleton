import { expect, test } from './fixtures';

/**
 * The skeleton's only page is a server component, so nothing here runs in the
 * browser yet and the coverage gate has nothing to hold. Replace this with
 * tests of your app's UI; every 'use client' module you add is held to 100 %
 * from then on.
 */
test('serves the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('App skeleton');
});
