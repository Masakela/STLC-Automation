import { Page, Locator } from '@playwright/test';

/** Products — /products.html  (auto-generated from http://127.0.0.1:8143) */
export class ProductsPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly sortBySelect: Locator;
  readonly addToCartButton: Locator;
  readonly button: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.sortBySelect = page.getByLabel('Sort by');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.button = page.locator('[data-qa="filter-open"]');
    this.loadMoreButton = page.getByRole('button', { name: 'Load more' });
  }

  async goto() {
    await this.page.goto('/products.html');
  }
}
