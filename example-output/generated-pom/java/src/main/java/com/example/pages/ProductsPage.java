package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/** Products — /products  (auto-generated from http://localhost:7099) */
public class ProductsPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator cartLink;
  public final Locator sortBySelect;
  public final Locator addBackpackButton;
  public final Locator addBikeButton;

  public ProductsPage(Page page) {
    this.page = page;
    this.homeLink = page.locator("a:has-text(\"Home\")");
    this.cartLink = page.getByTestId("cart-link");
    this.sortBySelect = page.locator("#sort");
    this.addBackpackButton = page.getByTestId("add-backpack");
    this.addBikeButton = page.getByTestId("add-bike");
  }

  public void navigate() {
    page.navigate("/products");
  }
}
