# Codeceptjs Docker

CodeceptJS packed into container with the Nightmare, Protractor, and WebDriverIO drivers.

## How to Use

This image comes with the necessary dependencies and packages to execute CodeceptJS tests.
Mount in your CodeceptJS config directory into the `/tests` directory in the docker container.

Sample mount: `-v path/to/codecept.json:/tests`

### Locally


You can execute CodeceptJS with Nightmare locally with no extra configuration.

```
docker run --net=host -v $PWD:/tests codeception/codeceptjs
```

Nightmare helper must be enabled in codecept.json config.

### Docker Compose

```yaml
version: '2'
services:
  codeceptjs:
    image: codeception/codeceptjs
    depends_on:
      - firefox
      - web
    volumes:
      - .:/tests
  web:
    image: node
    command: node app/server.js
    volumes:
      - .:/app
  firefox:
    image: selenium/standalone-firefox-debug:2.53.0
    ports:
      - '4444'
      - '5900'
```

### Linking Containers

If using the Protractor or WebDriverIO drivers, link the container with a Selenium Standalone docker container with an alias of `selenium`. Additionally, make sure your `codeceptjs.conf.js` contains the following to allow CodeceptJS to identify where Selenium is running.

```javascript
  ...
  helpers: {
    WebDriverIO: {
      ...
      host: process.env.HOST
      ...
    }
  }
  ...
```

```sh
$ docker run -d -P --name selenium-chrome selenium/standalone-chrome

# Alternatively, selenium/standalone-firefox can be used

$ docker run -it --rm -v /<path_to_codeceptjs_test_dir>/:/tests/ --link selenium-chrome:selenium codeception/codeceptjs
```

You may run use `-v $(pwd)/:tests/` if running this from the root of your CodeceptJS tests directory.
_Note: The output of your test run will appear in your local directory if your output path is `./output` in the CodeceptJS config_
_Note: If running with the Nightmare driver, it is not necessary to run a selenium docker container and link it. So `--link selenium-chrome:selenium` may be omitted_

### Build

To build this image:

```sh
$ docker build -t codeception/codeceptjs .
```