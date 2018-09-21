# allure

Allure reporter

![](https://user-images.githubusercontent.com/220264/45676511-8e052800-bb3a-11e8-8cbb-db5f73de2add.png)

Enables Allure reporter.

#### Usage

To start please install `allure-commandline` package (which requires Java 8)

    npm install -g allure-commandline --save-dev

Add this plugin to config file:

```js
"plugins": {
    "allure": {}
}
```

Run tests with allure plugin enabled:

    codeceptjs run --plugins allure

By default, allure reports are saved to `output` directory.
Launch Allure server and see the report like on a screenshot above:

    allure serve output

#### Configuration

-   `outputDir` - a directory where allure reports should be stored. Standard output directory is set by default.

**Parameters**

-   `config` **Any** 

# retryFailedStep

Retries each failed step in a test.

Add this plugin to config file:

```js
"plugins": {
    "runFailedStep": {
       "enabled": true
    }
}
```

Run tests with plugin enabled:

    codeceptjs run --plugins retryFailedStep

## Configuration:

-   `retries` - number of retries (by default 5),
-   `when` - function, when to perform a retry (accepts error as parameter)
-   `factor` - The exponential factor to use. Default is 2.
-   `minTimeout` - The number of milliseconds before starting the first retry. Default is 1000.
-   `maxTimeout` - The maximum number of milliseconds between two retries. Default is Infinity.
-   `randomize` - Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.

This plugin is very basic so it's recommended to improve it to match your custom needs.

**Parameters**

-   `config`  

# screenshotOnFail

Creates screenshot on failure. Screenshot is saved into `output` directory.

Initially this functionality was part of corresponding helper but has been moved into plugin since 1.4

This plugin is **enabled by default**.

#### Configuration

Configuration can either be taken from a corresponding helper (deprecated) or a from plugin config (recommended).

```js
"plugins": {
   "screenshotOnFail": {
     "enabled": true
   }
}
```

Possible config options:

-   `uniqueScreenshotNames`: use unique names for screenshot. Default: false.
-   `fullPageScreenshots`: make full page screenshots. Default: false.

**Parameters**

-   `config`  

# stepByStepReport

![](https://codecept.io/images/codeceptjs-slideshow.gif)

Generates step by step report for a test.
After each step in a test a screenshot is created. After test executed screenshots are combined into slideshow.
By default, reports are generated only for failed tests.

Run tests with plugin enabled:

    codeceptjs run --plugins stepByStepReport

#### Configuration

```js
"plugins": {
   "stepByStepReport": {
     "enabled": true
   }
}
```

Possible config options:

-   `deleteSuccessful`: do not save screenshots for successfully executed tests. Default: true.
-   `animateSlides`: should animation for slides to be used. Default: true.
-   `ignoreSteps`: steps to ignore in report. Array of RegExps is expected. Recommended to skip `grab*` and `wait*` steps.
-   `fullPageScreenshots`: should full page screenshots be used. Default: false.

#### Allure Reports

If Allure plugin is enabled this plugin attaches each saved screenshot to allure report.

**Parameters**

-   `config` **Any** 
