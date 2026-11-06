import { Page, Locator } from '@playwright/test';

/** Cart — /cart.html  (auto-generated from http://127.0.0.1:8143) */
export class CartPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly promoCodeInput: Locator;
  readonly button: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.promoCodeInput = page.getByPlaceholder('Promo code');
    this.button = page.getByTestId('remove-item');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goto() {
    await this.page.goto('/cart.html');
  }
}
