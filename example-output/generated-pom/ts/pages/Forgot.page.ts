import { Page, Locator } from '@playwright/test';

/** Forgot — /forgot  (auto-generated from http://localhost:7099) */
export class ForgotPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly emailInput: Locator;
  readonly sendResetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.locator('a:has-text("Home")');
    this.emailInput = page.locator('#em');
    this.sendResetButton = page.getByTestId('reset');
  }

  async goto() {
    await this.page.goto('/forgot');
  }
}
