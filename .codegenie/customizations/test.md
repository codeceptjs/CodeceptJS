# CodeceptJS Testing Cheat Sheet

## Testing Libraries and Frameworks
- Jest
- Chai
- Sinon
- Mocha

## Mocking and Stubbing
- Sinon is used for mocking and stubbing
- `sinon.spy()` for creating spies
- `sinon.mock()` for creating mocks
- `sinon.stub()` for creating stubs

## Assertions
- Chai assertions are used (`expect` syntax)
- Jest assertions are also used in some tests

## Test Structure
- `describe()` for grouping tests
- `it()` for individual test cases
- `before()`, `beforeEach()`, `after()`, `afterEach()` for setup and teardown

## CodeceptJS Specific
- `Feature()` for defining features
- `Scenario()` for defining scenarios
- `Given()`, `When()`, `Then()` for BDD-style steps
- `I` object for actor actions

## Helpers and Plugins
- Custom helpers can be created and used
- Plugins like `tryTo` and `subtitles` are available

## Configuration
- `codecept.conf.js` for main configuration
- Config can be manipulated programmatically using `config` module

## Events
- `event` module for handling test events
- Custom event listeners can be added

## Recorder
- `recorder` module for managing test execution flow

## Locators
- Custom locator strategies can be defined
- XPath and CSS selectors are supported

## Data Tables
- Gherkin-style data tables are supported in scenarios

## Retries
- `I.retry()` for retrying failed steps

## AI Assistant
- `AiAssistant` module for AI-powered testing assistance

## File Operations
- `fs` and `path` modules are used for file operations

## HTML Processing
- Functions for minifying and processing HTML for tests

## Artifacts
- Video recording and subtitle generation for failed tests

This cheat sheet covers the main testing practices and tools used in the CodeceptJS codebase. It includes information on testing frameworks, mocking, assertions, test structure, CodeceptJS-specific features, and various utilities and modules used throughout the tests.