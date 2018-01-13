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

## Acceptance Tests

### Testing Puppeteer Acceptance Tests

Make sure the acceptance tests.

```sh
node ./bin/codecept.js run -c ./test/acceptance/codecept.Puppeteer.js
```

You can also the tests by using the `--grep` option.

```sh
node ./bin/codecept.js run -c ./test/acceptance/codecept.Puppeteer.js --grep "within"
```

## Helpers

Please keep in mind that CodeceptJS have **unified API** for WebDriverIO, Appium, Protractor, SeleniumWebdriver, Nightmare. Tests written using those helpers should be compatible at syntax level. However, some of helpers may contain unique methods. That happen. If, for instance, WebDriverIO have method XXX and SeleniumWebDriver doesn't, you can implement XXX inside SeleniumWebDriver using the same method signature.

### Updating a WebDriverIO | SeleniumWebdriver | Nightmare

*Whenever a new method or new behavior is added it should be documented in a docblock. Valid JS-example is required! Do **not edit** `docs/helpers/`, those files are generated from docblocks in corresponding helpers! *

Working test is highly appreciated. To run the test suite you need:

* selenium server + chromedriver
* PHP installed

To launch PHP demo application run:

```sh
php -S 127.0.0.1:8000 -t test/data/app
```

Execute test suite:

```sh
mocha test/helper/WebDriverIO_test.js
mocha test/helper/Puppeteer_test.js
mocha test/helper/Nightmare_test.js
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

* selenium server + chromedriver

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

Before applying any Core changes please raise an issue to discuss that change with core team.

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

## Running tests in Dockerized environment

Instead of manually running php, json_server and selenium for before tests you
can use `docker-compose` to run those automatically.
You can find `docker-compose.yml` file in `test` directory and run all commands
from this directory. Currently we provide following commands to run tests with
respective dependencies:

### Run unit tests

```sh
docker-compose run --rm test-unit
```

### Run helper tests

```sh
docker-compose run --rm test-helpers

# or pass path to helper test to run specific helper,
# for example to run only WebDriverIO tests:
docker-compose run --rm test-helpers test/helper/WebDriverIO_test.js

# Or to run only rest and ApiDataFactory tests
docker-compose run --rm test-helpers test/rest
```

### Run acceptance tests

To that we provide two separate services respectively for WebDriverIO and
Nightmare tests:

```sh
docker-compose run --rm test-acceptance.webdriverio
docker-compose run --rm test-acceptance.nightmare
```

### Running against specific Node version

By default dockerized tests are run against node 6.9.5, you can run it against
specific version as long as there is Docker container available for such
version. To do that you need to build codecept's Docker image prior to running
tests and pass `NODE_VERSION` as build argument.

For example to prepare `test-helpers` containers based on node 8.7.0:

```sh
docker-compose build --build-arg NODE_VERSION=8.7.0 test-helpers
```

And now every command based on `test-helpers` service will use node 8.7.0. The
same argument can be passed when building unit and acceptance tests services.
