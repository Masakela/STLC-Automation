import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/Products.page';

test.describe('Products', () => {
  test('REQ-TODO Products renders its key elements', async ({ page }) => {
    const p = new ProductsPage(page);
    await p.goto();
    await expect(p.homeLink).toBeVisible();
    // TODO: assert real behavior for this page (fill forms, submit, verify outcomes).
  });
});
