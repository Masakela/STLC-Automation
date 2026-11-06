import { Page, Locator } from '@playwright/test';

/** Home — /  (auto-generated from http://127.0.0.1:8143) */
export class HomePage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly searchProductsInput: Locator;
  readonly getStartedButton: Locator;
  readonly button: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.searchProductsInput = page.getByLabel('Search products');
    this.getStartedButton = page.getByRole('button', { name: 'Get started' });
    this.button = page.getByTestId('cart-icon');
  }

  async goto() {
    await this.page.goto('/');
  }
}
