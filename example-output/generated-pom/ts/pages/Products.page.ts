import { Page, Locator } from '@playwright/test';

/** Products — /products  (auto-generated from http://localhost:7099) */
export class ProductsPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly cartLink: Locator;
  readonly sortBySelect: Locator;
  readonly addBackpackButton: Locator;
  readonly addBikeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.locator('a:has-text("Home")');
    this.cartLink = page.getByTestId('cart-link');
    this.sortBySelect = page.locator('#sort');
    this.addBackpackButton = page.getByTestId('add-backpack');
    this.addBikeButton = page.getByTestId('add-bike');
  }

  async goto() {
    await this.page.goto('/products');
  }
}
