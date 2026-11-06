import { Page, Locator } from '@playwright/test';

/** Cart — /cart  (auto-generated from http://localhost:7099) */
export class CartPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.locator('a:has-text("Home")');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async goto() {
    await this.page.goto('/cart');
  }
}
