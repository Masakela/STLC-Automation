import { Page, Locator } from '@playwright/test';

/** Contact — /contact.html  (auto-generated from http://127.0.0.1:8143) */
export class ContactPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly helpLink: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly sendMessageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.productsLink = page.getByRole('link', { name: 'Products' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.cartLink = page.getByRole('link', { name: 'Cart' });
    this.helpLink = page.getByRole('link', { name: 'Help' });
    this.fullNameInput = page.getByLabel('Full name');
    this.emailInput = page.getByLabel('Email');
    this.messageInput = page.getByLabel('Message');
    this.sendMessageButton = page.getByRole('button', { name: 'Send message' });
  }

  async goto() {
    await this.page.goto('/contact.html');
  }
}
