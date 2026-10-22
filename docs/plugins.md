---
permalink: /plugins
editLink: false
sidebar: auto
title: Plugins
---

# Plugins

CodeceptJS bundles the following plugins. Each plugin has its own page with full configuration reference.

## [aiTrace](/plugins/ai-trace)

Generates AI-friendly trace files for debugging with AI agents. This plugin creates a markdown file with test execution logs and links to all artifacts (screenshots, HTML, ARIA snapshots, browser logs, HTTP requests) for each step.

## [analyze](/plugins/analyze)

Uses AI to analyze test failures and provide insights

## [auth](/plugins/auth)

Logs user in for the first test and reuses session for next tests. Works by saving cookies into memory or file. If a session expires automatically logs in again.

## [autoDelay](/plugins/auto-delay)

Sometimes it takes some time for a page to respond to user's actions. Depending on app's performance this can be either slow or fast.

## [browser](/plugins/browser)

Overrides browser helper config from the command line. Works for all browser helpers (Playwright, Puppeteer, WebDriver, Appium) without touching `codecept.conf`.

## [coverage](/plugins/coverage)

Dumps code coverage from Playwright/Puppeteer after every test.

## [customLocator](/plugins/custom-locator)

Creates a [custom locator][1] by using special attributes in HTML.

## [customReporter](/plugins/custom-reporter)

Sample custom reporter for CodeceptJS.

## [expose](/plugins/expose)

Exposes properties from helper instances as injectable test arguments. Use it to access the underlying Playwright/Puppeteer `page`, the wdio `browser` client, or any other helper internal directly from a Scenario:

## [heal](/plugins/heal)

Self-healing tests with AI.

## [junitReporter](/plugins/junit-reporter)

Generates a JUnit-compatible XML report after a test run.

## [pageInfo](/plugins/page-info)

Collects information from web page after each failed test and adds it to the test as an artifact. It is suggested to enable this plugin if you run tests on CI and you need to debug failed tests. This plugin can be paired with `analyze` plugin to provide more context.

## [pause](/plugins/pause)

Pauses test execution interactively. Replaces the legacy `pauseOnFail` plugin. The default `on=fail` matches the old `pauseOnFail` behavior.

## [pauseOnFail](/plugins/pause-on-fail)

Starts an interactive pause when a test fails.

## [retryFailedStep](/plugins/retry-failed-step)

Retries each failed step in a test.

## [screencast](/plugins/screencast)

Records a video of tests. Uses Playwright's `page.screencast` API (WebM) when the active helper is Playwright, or raw CDP `Page.startScreencast` (APNG, assembled in-process) when the active helper is `CDPBrowser` or a subclass (`Obscura`, `Kitesurf`, ...). Which path is used is detected automatically per test run; nothing in the config changes between them.

## [screenshot](/plugins/screenshot)

Saves screenshots from the browser at points triggered by `on=`.

## [screenshotOnFail](/plugins/screenshot-on-fail)

Saves a screenshot when a test fails.

## [sitemap](/plugins/sitemap)

Collects all pages visited while tests are running and saves them as a [sitemap][1] XML file.

## [stepTimeout](/plugins/step-timeout)

Set timeout for test steps globally.

