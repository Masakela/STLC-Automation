package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** Cart — /cart.html  (auto-generated from http://127.0.0.1:8143) */
public class CartPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator productsLink;
  public final Locator loginLink;
  public final Locator cartLink;
  public final Locator helpLink;
  public final Locator promoCodeInput;
  public final Locator button;
  public final Locator checkoutButton;

  public CartPage(Page page) {
    this.page = page;
    this.homeLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Home"));
    this.productsLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Products"));
    this.loginLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Login"));
    this.cartLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cart"));
    this.helpLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Help"));
    this.promoCodeInput = page.getByPlaceholder("Promo code");
    this.button = page.getByTestId("remove-item");
    this.checkoutButton = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Checkout"));
  }

  public void navigate() {
    page.navigate("/cart.html");
  }
}
