import { test, expect } from '@playwright/test';

import { loginAsMember } from './fixtures/auth';
import { selectors } from './utils/selectors';

test.describe('Academy Progress', () => {
  test('member completes lesson and sees progress update', async ({ page }) => {
    await loginAsMember(page);
    await page.click(selectors.nav.academy);
    await expect(page).toHaveURL(/\/academy/);

    await page.locator(selectors.academy.courseCard('growth-playbook')).click();
    await page.locator(selectors.academy.lessonComplete).click();

    await expect(page.locator(selectors.academy.progressPercentage)).toHaveText(/100%/);
  });
});
