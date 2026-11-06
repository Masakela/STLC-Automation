package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

/** Forgot — /forgot  (auto-generated from http://localhost:7099) */
public class ForgotPage {
  private final Page page;
  public final Locator homeLink;
  public final Locator emailInput;
  public final Locator sendResetButton;

  public ForgotPage(Page page) {
    this.page = page;
    this.homeLink = page.locator("a:has-text(\"Home\")");
    this.emailInput = page.locator("#em");
    this.sendResetButton = page.getByTestId("reset");
  }

  public void navigate() {
    page.navigate("/forgot");
  }
}
