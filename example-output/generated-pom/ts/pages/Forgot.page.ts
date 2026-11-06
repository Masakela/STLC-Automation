import { Page, Locator } from '@playwright/test';

/** Forgot — /forgot.html  (auto-generated from http://127.0.0.1:8143) */
export class ForgotPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly emailInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.emailInput = page.getByLabel('Email');
    this.sendResetLinkButton = page.getByRole('button', { name: 'Send reset link' });
    this.backToLoginLink = page.getByRole('link', { name: 'Back to login' });
  }

  async goto() {
    await this.page.goto('/forgot.html');
  }
}
