# Contributing

Thanks for getting here. If you have a good will to improve CodeceptJS we are always glad to help. Ask questions, raise issues, ping in Twitter.

To start you need:

1.  Fork the repo.
2.  Run `npm install` to install all required libraries
3.  Do the changes.
4.  Add/Update Test (if possible)
5.  Commit and Push to your fork
6.  Make Pull Request

Depending on a type of a change you should do the following.

## Helpers

Please keep in mind that CodeceptJS have **unified API** for WebDriverIO, Appium, Protractor, SeleniumWebdriver, Nightmare. Tests written using those helpers should be compatible at syntax level. However, some of helpers may contain unique methods. That happen. If, for instance, WebDriverIO have method XXX and SeleniumWebDriver doesn't, you can implement XXX inside SeleniumWebDriver using the same method signature.

### Updating a WebDriverIO | SeleniumWebdriver | Nightmare

*Whenever a new method or new behavior is added it should be documented in a docblock. Valid JS-example is required! Do **not edit** `docs/helpers/`, those files are generated from docblocks in corresponding helpers! *

Working test is highly appreciated. To run the test suite you need:

*   selenium server + chromedriver
*   PHP installed

To launch PHP demo application run:

```sh
php -S 127.0.0.1:8000 -t test/data/app
```

Execute test suite:

```sh
mocha test/helper/WebDriverIO_test.js
mocha test/helper/SeleniumWebdriver_test.js
```

Use `--grep` to execute tests only for changed parts.

If you need to add new HTML page for a test, please create new `.php` file in to `tests/data/app/view/form`:

Adding `myexample` page:

```sh
tests/data/app/view/form/myexample.php
```

Then is should be accessible at:

```sh
http://localhost:8000/form/myexample
```

### Updating Protractor

*Whenever a new method or new behavior is added it should be documented in a docblock. Valid JS-example is required! Do **not edit** `docs/helpers/`, those files are generated from docblocks in corresponding helpers! *

Protractor Helper extends SeleniumWebdriver. For non-protractor specific changes you will need to update SeleniumWebdriver helper instead. See section above.

In case you do Protractor-specific change, please add a test:To run the test suite you need:

*   selenium server + chromedriver

Demo application is located at: [http://davertmik.github.io/angular-demo-app](http://davertmik.github.io/angular-demo-app)

### Updating REST | ApiDataFactory

*Whenever a new method or new behavior is added it should be documented in a docblock. Valid JS-example is required!*

Adding a test is highly appreciated.

Start JSON server to run tests:

```sh
npm run json-server
```

Edit a test at `tests/helper/REST_test.js` or `test/helper/ApiDataFactory_test.js`

## Appium

*Whenever a new method or new behavior is added it should be documented in a docblock. Valid JS-example is required! Do **not edit** `docs/helpers/`, those files are generated from docblocks in corresponding helpers! *

It is recommended to run mobile tests on CI.
So do the changes, make pull request, see the CI status.
Appium tests are executed at **Semaphore CI**.

## Core Changes

Before applying any Core changes please raise an issue to discucss that change with core team.

Whenever you implemented a feature/bugfix

Run unit tests:

```sh
mocha test/unit
```

Run general tests:

```sh
mocha test/runner
```

Please try to add corresponding testcase to runner or unit.
