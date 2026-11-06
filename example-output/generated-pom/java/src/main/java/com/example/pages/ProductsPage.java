package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** Products — /products.html  (auto-generated from http://127.0.0.1:8143) */
public class ProductsPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator productsLink;
  public final Locator loginLink;
  public final Locator cartLink;
  public final Locator helpLink;
  public final Locator sortBySelect;
  public final Locator addToCartButton;
  public final Locator button;
  public final Locator loadMoreButton;

  public ProductsPage(Page page) {
    this.page = page;
    this.homeLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Home"));
    this.productsLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Products"));
    this.loginLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Login"));
    this.cartLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cart"));
    this.helpLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Help"));
    this.sortBySelect = page.getByLabel("Sort by");
    this.addToCartButton = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Add to cart"));
    this.button = page.locator("[data-qa=\"filter-open\"]");
    this.loadMoreButton = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Load more"));
  }

  public void navigate() {
    page.navigate("/products.html");
  }
}
