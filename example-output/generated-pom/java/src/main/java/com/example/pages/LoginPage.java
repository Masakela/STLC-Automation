package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** Login — /login.html  (auto-generated from http://127.0.0.1:8143) */
public class LoginPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator productsLink;
  public final Locator loginLink;
  public final Locator cartLink;
  public final Locator helpLink;
  public final Locator emailInput;
  public final Locator passwordInput;
  public final Locator couponCodeInput;
  public final Locator signInButton;
  public final Locator forgotPasswordLink;

  public LoginPage(Page page) {
    this.page = page;
    this.homeLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Home"));
    this.productsLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Products"));
    this.loginLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Login"));
    this.cartLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cart"));
    this.helpLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Help"));
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.couponCodeInput = page.getByPlaceholder("Coupon code");
    this.signInButton = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Sign in"));
    this.forgotPasswordLink = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Forgot password?"));
  }

  public void navigate() {
    page.navigate("/login.html");
  }
}
