import { test, expect } from '@playwright/test';

import { loginAsMember } from './fixtures/auth';
import { selectors } from './utils/selectors';

test.describe('Cybervault Resource Download', () => {
  test('member filters resources and downloads asset', async ({ page }) => {
    await loginAsMember(page);

    await page.click(selectors.nav.cybervault);
    await expect(page).toHaveURL(/\/cybervault/);
    await expect(page.locator(selectors.cybervault.library)).toBeVisible();

    await page.fill(selectors.cybervault.searchInput, 'playbook');
    await page.click(selectors.cybervault.filterTag('growth'));
    await page.click(selectors.cybervault.downloadButton('playbook'));

    await expect(page.locator(selectors.cybervault.toast)).toBeVisible();
  });
});
