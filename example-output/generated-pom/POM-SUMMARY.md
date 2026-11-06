# Generated Page Object Model

Source: http://localhost:7099/ · 6 page(s) crawled · generated 2026-11-06T03:40:31.665Z

## Pages
- **HomePage** — `/` — 6 locators (ts + java)
- **LoginPage** — `/login` — 5 locators (ts + java)
- **ProductsPage** — `/products` — 5 locators (ts + java)
- HelpPage — (no addressable elements, skipped)
- **ForgotPage** — `/forgot` — 3 locators (ts + java)
- **CartPage** — `/cart` — 2 locators (ts + java)

## Layout
- `ts/pages/*.page.ts` — TypeScript page objects (@playwright/test)
- `ts/tests/*.spec.ts` — skeleton specs (one per page)
- `java/src/main/java/com/example/pages/*Page.java` — Java page objects (Playwright for Java)
- `java/src/test/java/com/example/tests/*Test.java` — skeleton TestNG tests

## Notes
Locators are auto-derived (getByTestId > getByRole > getByLabel > #id > [name] > css). They are a
**reviewed starting point** — confirm the important ones and replace the skeleton assertions with
real behavior. The STLC pipeline maps each page/flow to requirements and fills these tests.
