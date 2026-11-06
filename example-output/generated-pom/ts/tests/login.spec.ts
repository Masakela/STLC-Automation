import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/Login.page';

test.describe('Login', () => {
  test('REQ-TODO Login renders its key elements', async ({ page }) => {
    const p = new LoginPage(page);
    await p.goto();
    await expect(p.homeLink).toBeVisible();
    // TODO: assert real behavior for this page (fill forms, submit, verify outcomes).
  });
});
