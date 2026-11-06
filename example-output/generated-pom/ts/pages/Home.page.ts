import { Page, Locator } from '@playwright/test';

/** Home — /  (auto-generated from http://localhost:7099) */
export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly productsLink: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly signUpButton: Locator;
  readonly helpCenterLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.locator('a.nav-link.primary');
    this.productsLink = page.locator('a:has-text("Products")');
    this.searchInput = page.locator('#q');
    this.searchButton = page.getByTestId('go');
    this.signUpButton = page.locator('[data-qa="newsletter-signup"]');
    this.helpCenterLink = page.locator('a.footer-link');
  }

  async goto() {
    await this.page.goto('/');
  }
}
