import type { Page } from '@playwright/test';

import { selectors } from '../utils/selectors';

export const loginAsMember = async (page: Page, email = 'member@example.com', password = 'Secret123!') => {
  await page.goto('/login');
  await page.fill(selectors.auth.email, email);
  await page.fill(selectors.auth.password, password);
  await page.click(selectors.auth.submit);
};
