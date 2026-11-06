package com.example.tests;

import com.example.pages.HomePage;
import com.microsoft.playwright.*;
import org.testng.annotations.*;

public class HomeTest {
  Playwright pw; Browser browser; Page page;

  @BeforeMethod public void setUp() {
    pw = Playwright.create();
    browser = pw.chromium().launch();
    page = browser.newContext(new Browser.NewContextOptions().setBaseURL("http://127.0.0.1:8143")).newPage();
  }
  @AfterMethod public void tearDown() { if (browser != null) browser.close(); if (pw != null) pw.close(); }

  @Test public void homeRendersKeyElements() {
    HomePage p = new HomePage(page);
    p.navigate();
    com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat(p.homeLink).isVisible();
    // TODO: assert real behavior for this page.
  }
}
