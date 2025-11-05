import { test, expect } from '@playwright/test';

import { loginAsMember } from './fixtures/auth';
import { selectors } from './utils/selectors';

test.describe('App shell smoke', () => {
  test('member navigates across hub, hidra, cybervault and admin areas', async ({ page }) => {
    await loginAsMember(page);

    await expect(page.locator(selectors.hub.home)).toBeVisible();
    await expect(page.locator(selectors.hub.saasCarousel)).toBeVisible();
    await expect(page.locator(selectors.hub.metricsOverview)).toBeVisible();
    await expect(page.locator(selectors.hub.metricTotal)).toContainText(/\d/);
    await expect(page.locator(selectors.hub.metricDelivered)).toContainText(/\d/);

    await page.click(selectors.nav.hidra);
    await expect(page).toHaveURL(/\/hidra/);
    await expect(page.locator(selectors.hidra.dashboard)).toBeVisible();
    await expect(page.locator(selectors.hidra.dashboard).getByText('Total')).toBeVisible();

    await page.click(selectors.nav.cybervault);
    await expect(page).toHaveURL(/\/cybervault/);
    await expect(page.locator(selectors.cybervault.library)).toBeVisible();
    await page.click(selectors.cybervault.downloadButton('playbook'));
    await expect(page.locator(selectors.cybervault.toast)).toBeVisible();

    await page.click(selectors.nav.admin);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator(selectors.admin.dashboard)).toBeVisible();
    await expect(page.locator(selectors.admin.dashboard).getByText(/Banners ativos|Painel de controle/)).toBeVisible();
  });
});
