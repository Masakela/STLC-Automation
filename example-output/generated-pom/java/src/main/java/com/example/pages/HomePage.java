package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/** Home — /  (auto-generated from http://localhost:7099) */
public class HomePage {
  private final Page page;
  public final Locator loginLink;
  public final Locator productsLink;
  public final Locator searchInput;
  public final Locator searchButton;
  public final Locator signUpButton;
  public final Locator helpCenterLink;

  public HomePage(Page page) {
    this.page = page;
    this.loginLink = page.locator("a.nav-link.primary");
    this.productsLink = page.locator("a:has-text(\"Products\")");
    this.searchInput = page.locator("#q");
    this.searchButton = page.getByTestId("go");
    this.signUpButton = page.locator("[data-qa=\"newsletter-signup\"]");
    this.helpCenterLink = page.locator("a.footer-link");
  }

  public void navigate() {
    page.navigate("/");
  }
}
