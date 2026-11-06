import { test, expect } from '@playwright/test';
import { ContactPage } from '../pages/Contact.page';

test.describe('Contact', () => {
  test('REQ-TODO Contact renders its key elements', async ({ page }) => {
    const p = new ContactPage(page);
    await p.goto();
    await expect(p.homeLink).toBeVisible();
    // TODO: assert real behavior for this page (fill forms, submit, verify outcomes).
  });
});
