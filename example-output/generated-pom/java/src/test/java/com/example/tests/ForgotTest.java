package com.example.tests;

import com.example.pages.ForgotPage;
import com.microsoft.playwright.*;
import org.testng.annotations.*;

public class ForgotTest {
  Playwright pw; Browser browser; Page page;

  @BeforeMethod public void setUp() {
    pw = Playwright.create();
    browser = pw.chromium().launch();
    page = browser.newContext(new Browser.NewContextOptions().setBaseURL("http://localhost:7099")).newPage();
  }
  @AfterMethod public void tearDown() { if (browser != null) browser.close(); if (pw != null) pw.close(); }

  @Test public void forgotRendersKeyElements() {
    ForgotPage p = new ForgotPage(page);
    p.navigate();
    com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat(p.homeLink).isVisible();
    // TODO: assert real behavior for this page.
  }
}
