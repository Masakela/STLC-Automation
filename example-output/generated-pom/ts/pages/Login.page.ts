import { Page, Locator } from '@playwright/test';

/** Login — /login  (auto-generated from http://localhost:7099) */
export class LoginPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.locator('a:has-text("Home")');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.signInButton = page.getByTestId('signin');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot password?")');
  }

  async goto() {
    await this.page.goto('/login');
  }
}
