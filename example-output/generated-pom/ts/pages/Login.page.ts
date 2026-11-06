import { Page, Locator } from '@playwright/test';

/** Login — /login.html  (auto-generated from http://127.0.0.1:8143) */
export class LoginPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly couponCodeInput: Locator;
  readonly signInButton: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.couponCodeInput = page.getByPlaceholder('Coupon code');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto() {
    await this.page.goto('/login.html');
  }
}
