import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/Home.page';

test.describe('Home', () => {
  test('REQ-TODO Home renders its key elements', async ({ page }) => {
    const p = new HomePage(page);
    await p.goto();
    await expect(p.homeLink).toBeVisible();
    // TODO: assert real behavior for this page (fill forms, submit, verify outcomes).
  });
});
