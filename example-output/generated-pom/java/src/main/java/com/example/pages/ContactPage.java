package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** Contact — /contact.html  (auto-generated from http://127.0.0.1:8143) */
public class ContactPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator productsLink;
  public final Locator loginLink;
  public final Locator cartLink;
  public final Locator helpLink;
  public final Locator fullNameInput;
  public final Locator emailInput;
  public final Locator messageInput;
  public final Locator sendMessageButton;

  public ContactPage(Page page) {
    this.page = page;
    this.homeLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Home"));
    this.productsLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Products"));
    this.loginLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Login"));
    this.cartLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cart"));
    this.helpLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Help"));
    this.fullNameInput = page.getByLabel("Full name");
    this.emailInput = page.getByLabel("Email");
    this.messageInput = page.getByLabel("Message");
    this.sendMessageButton = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Send message"));
  }

  public void navigate() {
    page.navigate("/contact.html");
  }
}
