import { test, expect } from '@playwright/test';

import { loginAsMember } from './fixtures/auth';
import { selectors } from './utils/selectors';

test.describe('Hidra Campaign Workflow', () => {
  test('member configures Evolution and creates campaign draft', async ({ page }) => {
    await loginAsMember(page);

    await page.click(selectors.nav.hidra);
    await expect(page).toHaveURL(/\/hidra/);
    await expect(page.locator(selectors.hidra.dashboard)).toBeVisible();

    await page.locator(selectors.hidra.configureEvolution).click();
    await page.fill(selectors.hidra.urlInput, 'https://api.evolution.dev');
    await page.fill(selectors.hidra.apiKeyInput, 'sk_test_123');
    await page.locator(selectors.hidra.configSubmit).click();

    await page.locator(selectors.hidra.createCampaign).click();
    await page.fill(selectors.hidra.nameInput, 'Campanha Piloto');
    await page.locator(selectors.hidra.saveCampaign).click();

    await expect(page.locator(selectors.hidra.campaignRow('Campanha Piloto'))).toBeVisible();
  });
});
