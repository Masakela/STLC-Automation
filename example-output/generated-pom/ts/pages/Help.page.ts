import { Page, Locator } from '@playwright/test';

/** Help — /help.html  (auto-generated from http://127.0.0.1:8143) */
export class HelpPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly contactSupportLink: Locator;
  readonly faqToggleButton: Locator;
  readonly yourFeedbackInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.contactSupportLink = page.getByRole('link', { name: 'Contact support' });
    this.faqToggleButton = page.locator('#faq-toggle');
    this.yourFeedbackInput = page.getByLabel('Your feedback');
  }

  async goto() {
    await this.page.goto('/help.html');
  }
}
