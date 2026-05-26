---
permalink: /migrate-from-java
title: Migrate from Java Selenium to CodeceptJS
---

# Migrate from Java Selenium to CodeceptJS

## Start here: what changes when you leave the JVM

On the JVM, an end-to-end suite is basically its own product. It has its own Maven or Gradle build, its own dependencies, and a JVM that has to warm up before anything runs. In practice it ends up with its own team too — application engineers stay on the app, QA stays on the tests, and the suite drifts whenever nobody is watching it.

In Node there is no compile or build step. Running tests in NodeJS saves time. NodeJS ecosystem is fastest growing opensource ecosystem, with awesome depenency management tools like npm, bun, pnpm. While Java tests still work JS ecosystem is richer and easier to use. Tools like Playwright and Puppeteer originally started on NodeJS.

Even migrating from Java to JavaScript seems like a huge task, it is actually not.
We prepared a set of skills for, so you can relax and 
[let an agent do the migration](#let-an-agent-do-the-migration).

## Comparison

The original test in Java Selenium:

```java
// Java + Selenium + JUnit
@Test
public void userCanLogin() {
    WebDriver driver = new ChromeDriver();
    WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

    driver.get("https://example.com/login");
    wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("username")));

    driver.findElement(By.id("username")).sendKeys("alice");
    driver.findElement(By.id("password")).sendKeys("secret");
    driver.findElement(By.cssSelector("button[type=submit]")).click();

    wait.until(ExpectedConditions.urlContains("/dashboard"));
    WebElement welcome = wait.until(
        ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".welcome"))
    );
    assertEquals("Welcome, Alice", welcome.getText());
}
```

Will look in CodeceptJS:

```js
// CodeceptJS
Scenario('user can log in', ({ I }) => {
  I.amOnPage('/login');
  I.fillField('Username', 'alice');
  I.fillField('Password', 'secret');
  I.click('Sign in');
  I.seeInCurrentUrl('/dashboard');
  I.see('Welcome, Alice', '.welcome');
});
```

And here is how this test looks while running — every step is printed live, in the same order it was written:

```text
user can log in
  I am on page "/login"
  I fill field "Username", "alice"
  I fill field "Password", "secret"
  I click "Sign in"
  I see in current url "/dashboard"
  I see "Welcome, Alice", ".welcome"
```

## Let an agent do the migration

The conversions above are mechanical, so you do not have to do them by hand, and the work does not cost you working time. Install the skills bundle, point an agent at the repo, and check back when it reports.

The **`migrate-selenium-java-to-codeceptjs`** skill in the [CodeceptJS skills bundle](https://github.com/codeceptjs/skills) does the whole port:

1. Inventories the page objects, helper classes, hooks, and data providers.
2. Sets up CodeceptJS beside the Java suite with the WebDriver helper.
3. Ports the page objects and helpers.
4. Converts each spec.
5. Runs the full suite.

First runs fail, because locators drift and timing changes. The agent then uses the `debugging-codeceptjs-tests` skill to fix each failure against the live browser before moving on. Your Java suite keeps running in CI until the port is green, so nothing is at risk while the agent works.

Install the bundle in Claude Code:

```text
/plugin marketplace add codeceptjs/skills
/plugin install codeceptjs@codeceptjs-skills
```

Or any other agent:

```bash
npx skills add codeceptjs/skills
```

Then ask: *"Migrate this Java Selenium suite to CodeceptJS."* The skill triggers on the Maven or Gradle and `org.openqa.selenium` signatures in your repo. Start it, do other work, and read the step output when it reports back.

## Pointers

- [/agents](/agents) for how the agent and MCP loop works
- [/webdriver](/webdriver) for the default helper in this migration, with driver auto-start
- [/playwright](/playwright) for the optional follow-up swap
- [/locators](/locators) for semantic, ARIA, and `locate()` locators
- [/pageobjects](/pageobjects) for ported `@FindBy` page objects
- [/auth](/auth) for login and session reuse
- [/api](/api) for the REST helper used in RestAssured ports
- [/bdd](/bdd) for CodeceptJS BDD in Cucumber-JVM ports
