package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/** Cart — /cart  (auto-generated from http://localhost:7099) */
public class CartPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator checkoutButton;

  public CartPage(Page page) {
    this.page = page;
    this.homeLink = page.locator("a:has-text(\"Home\")");
    this.checkoutButton = page.getByTestId("checkout");
  }

  public void navigate() {
    page.navigate("/cart");
  }
}
