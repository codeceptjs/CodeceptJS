// With tsx, you can import without extension - tsx handles resolution
import loginPage from "./pages/Login";

Feature("TypeScript tsx ESM with type:module");

Scenario("Import page object without extension using tsx", () => {
  loginPage.login("testuser");
});

Scenario("Page object methods work correctly", () => {
  loginPage.login("admin");
  loginPage.logout();
});
