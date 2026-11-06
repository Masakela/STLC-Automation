package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** Help — /help.html  (auto-generated from http://127.0.0.1:8143) */
public class HelpPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator productsLink;
  public final Locator loginLink;
  public final Locator cartLink;
  public final Locator helpLink;
  public final Locator contactSupportLink;
  public final Locator faqToggleButton;
  public final Locator yourFeedbackInput;

  public HelpPage(Page page) {
    this.page = page;
    this.homeLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Home"));
    this.productsLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Products"));
    this.loginLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Login"));
    this.cartLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cart"));
    this.helpLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Help"));
    this.contactSupportLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Contact support"));
    this.faqToggleButton = page.locator("#faq-toggle");
    this.yourFeedbackInput = page.getByLabel("Your feedback");
  }

  public void navigate() {
    page.navigate("/help.html");
  }
}
