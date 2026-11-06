# Generated Page Object Model

Source: http://127.0.0.1:8143/ · 7 page(s) crawled · generated 2026-11-06T13:26:46.701Z

## Pages
- **HomePage** — `/` — 8 locators (ts + java)
- **ProductsPage** — `/products.html` — 9 locators (ts + java)
- **LoginPage** — `/login.html` — 10 locators (ts + java)
- **CartPage** — `/cart.html` — 8 locators (ts + java)
- **HelpPage** — `/help.html` — 8 locators (ts + java)
- **ForgotPage** — `/forgot.html` — 8 locators (ts + java)
- **ContactPage** — `/contact.html` — 9 locators (ts + java)

## Layout
- `ts/pages/*.page.ts` — TypeScript page objects (@playwright/test)
- `ts/tests/*.spec.ts` — skeleton specs (one per page)
- `java/src/main/java/com/example/pages/*Page.java` — Java page objects (Playwright for Java)
- `java/src/test/java/com/example/tests/*Test.java` — skeleton TestNG tests

## Notes
Locators are auto-derived (user-facing getByRole/getByLabel/getByText > getByTestId > data-* > #id > class > css). They are a
**reviewed starting point** — confirm the important ones and replace the skeleton assertions with
real behavior. The STLC pipeline maps each page/flow to requirements and fills these tests.
