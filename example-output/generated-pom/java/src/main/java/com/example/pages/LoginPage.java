package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/** Login — /login  (auto-generated from http://localhost:7099) */
public class LoginPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator emailInput;
  public final Locator passwordInput;
  public final Locator signInButton;
  public final Locator forgotPasswordLink;

  public LoginPage(Page page) {
    this.page = page;
    this.homeLink = page.locator("a:has-text(\"Home\")");
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.signInButton = page.getByTestId("signin");
    this.forgotPasswordLink = page.locator("a:has-text(\"Forgot password?\")");
  }

  public void navigate() {
    page.navigate("/login");
  }
}
