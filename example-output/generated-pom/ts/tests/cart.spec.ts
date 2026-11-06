import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/Cart.page';

test.describe('Cart', () => {
  test('REQ-TODO Cart renders its key elements', async ({ page }) => {
    const p = new CartPage(page);
    await p.goto();
    await expect(p.homeLink).toBeVisible();
    // TODO: assert real behavior for this page (fill forms, submit, verify outcomes).
  });
});
