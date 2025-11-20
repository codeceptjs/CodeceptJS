// Test using .js extension to import .ts file (ESM + TypeScript best practice)
import loginPage from "./pages/Login.js";

Feature("TypeScript ESM Imports");

Scenario("Import page object with .js extension", () => {
  loginPage.login("testuser");
});

Scenario("Page object methods work correctly", () => {
  loginPage.login("admin");
  loginPage.logout();
});
