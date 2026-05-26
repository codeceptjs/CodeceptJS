# Codeceptjs Docker

CodeceptJS has an [official docker image](https://hub.docker.com/r/codeceptjs/codeceptjs) based on Playwright image. Image supports Playwright, Puppeteer, and WebDriver engines.

## How to Use

This image comes with the necessary dependencies and packages to execute CodeceptJS tests.
Mount in your CodeceptJS config directory into the `/tests` directory in the docker container.

Sample mount: `-v path/to/codecept.conf.js:/tests`

CodeceptJS runner is available inside container as `codeceptjs`.

### Locally

You can execute CodeceptJS with Puppeteer locally with no extra configuration.

```sh
docker run --net=host -v $PWD:/tests codeceptjs/codeceptjs
```

To customize execution call `codeceptjs` command:

```sh
# run tests with steps
docker run --net=host -v $PWD:/tests codeceptjs/codeceptjs codeceptjs run --steps

# run tests with @user in a name
docker run --net=host -v $PWD:/tests codeceptjs/codeceptjs codeceptjs run --grep "@user"
```


### Docker Compose

```yaml
version: '2'
services:
  codeceptjs:
    image: codeceptjs/codeceptjs
    depends_on:
      - web
    volumes:
      - .:/tests
  web:
    image: node
    command: node app/server.js
    volumes:
      - .:/app
```

The official image bundles browsers, and WebdriverIO 9 starts the matching driver automatically — no separate Selenium container or container linking is required for the WebDriver engine.

_Note: The output of your test run will appear in your local directory if your output path is `./output` in the CodeceptJS config_

### Build

To build this image:

```sh
docker build -t codeceptjs/codeceptjs .
```

* this directory will be added as `/codecept` insde container
* tests directory is expected to be mounted as `/tests`
* `codeceptjs` is a synlink to `/codecept/bin/codecept.js`

To build this image with your desired Node version:

```sh
docker build -t codeceptjs/codeceptjs . --build-arg NODE_VERSION=12.10.0
```

### Passing Options

Options can be passed by calling `codeceptjs`:

```
docker run -v $PWD:/tests codeceptjs/codeceptjs codeceptjs run --debug
```

Alternatively arguments to `codecept run` command can be passed via `CODECEPT_ARGS` environment variable. For example to run your tests with debug
output:

```yaml
version: '2'
services:
  codeceptjs:
    image: codeceptjs/codeceptjs
    environment:
      - CODECEPT_ARGS=--debug
    volumes:
      - .:/tests
```

You can also use `run-workers`to run tests by passing `NO_OF_WORKERS`, additionally, you can pass more params like showing the debug info as the following example:

```yaml
version: '2'
services:
  codeceptjs:
    image: codeceptjs/codeceptjs
    environment:
      - NO_OF_WORKERS=3
      - CODECEPT_ARGS=--debug
    volumes:
      - .:/tests
```
