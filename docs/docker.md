---
id: docker
title: Docker
---


CodeceptJS packed into container with the Nightmare, Protractor, Puppeteer, and WebDriver drivers.

## How to Use

This image comes with the necessary dependencies and packages to execute CodeceptJS tests.
Mount in your CodeceptJS config directory into the `/tests` directory in the docker container.

Sample mount: `-v path/to/codecept.json:/tests`

CodeceptJS runner is available inside container as `codeceptjs`.

### Locally

You can execute CodeceptJS with Puppeteer or Nightmare locally with no extra configuration.

```sh
docker run --net=host -v $PWD:/tests codeception/codeceptjs
```

To customize execution call `codeceptjs` command:

```sh
# run tests with steps
docker run --net=host -v $PWD:/tests codeception/codeceptjs codeceptjs run --steps

# run tests with @user in a name
docker run --net=host -v $PWD:/tests codeception/codeceptjs codeceptjs run --grep "@user"
```


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

If using the Protractor or WebDriver drivers, link the container with a Selenium Standalone docker container with an alias of `selenium`. Additionally, make sure your `codeceptjs.conf.js` contains the following to allow CodeceptJS to identify where Selenium is running.

```javascript
  ...
  helpers: {
    WebDriver: {
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

You may run use `-v $(pwd)/:/tests/` if running this from the root of your CodeceptJS tests directory.
_Note: The output of your test run will appear in your local directory if your output path is `./output` in the CodeceptJS config_
_Note: If running with the Nightmare driver, it is not necessary to run a selenium docker container and link it. So `--link selenium-chrome:selenium` may be omitted_

### Build

To build this image:

```sh
docker build -t codeception/codeceptjs .
```

* this directory will be added as `/codecept` insde container
* tests directory is expected to be mounted as `/tests`
* `codeceptjs` is a symlink to `/codecept/bin/codecept.js`

### Passing Options

Options can be passed by calling `codeceptjs`:

```
docker run -v $PWD:/tests codeception/codeceptjs codeceptjs run --debug
```

Alternatively arguments to `codecept run` command can be passed via `CODECEPT_ARGS` environment variable. For example to run your tests with debug
output:

```yaml
version: '2'
services:
  codeceptjs:
    image: codeception/codeceptjs
    environment:
      - CODECEPT_ARGS=--debug
    volumes:
      - .:/tests
```

Moreover, alternatively arguments to `codecept run-multiple` command can be passed via `RUN_MULTIPLE` and `CODECEPT_ARGS` environment variable.
For example this is what looks like in your codeceptjs.conf.js

```yaml
"multiple": {
  "parallel": {
    // Splits tests into 2 chunks
    "chunks": 2
  }
}
```

Then to execute them use run-multiple command passing configured suite, which is parallel in this example:

```yaml
version: '2'
services:
  codeceptjs:
    image: codeception/codeceptjs
    environment:
      - RUN_MULTIPLE=true
      - CODECEPT_ARGS=parallel
    volumes:
      - .:/tests
```
If no `CODECEPT_ARGS` provided and `RUN_MULTIPLE` is `true`, tests will proceed with `CODECEPT_ARGS=--all`
