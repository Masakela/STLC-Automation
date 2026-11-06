package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** Home — /  (auto-generated from http://127.0.0.1:8143) */
public class HomePage {
  private final Page page;
  public final Locator homeLink;
  public final Locator productsLink;
  public final Locator loginLink;
  public final Locator cartLink;
  public final Locator helpLink;
  public final Locator searchProductsInput;
  public final Locator getStartedButton;
  public final Locator button;

  public HomePage(Page page) {
    this.page = page;
    this.homeLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Home"));
    this.productsLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Products"));
    this.loginLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Login"));
    this.cartLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cart"));
    this.helpLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Help"));
    this.searchProductsInput = page.getByLabel("Search products");
    this.getStartedButton = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Get started"));
    this.button = page.getByTestId("cart-icon");
  }

  public void navigate() {
    page.navigate("/");
  }
}
