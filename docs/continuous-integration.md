---
permalink: /continuous-integration
title: Continuous Integration
---

# Continuous Integration

CodeceptJS runs in any CI that can install Node.js. This page covers the setup, then provides ready-to-use configs for the major CI systems.

## Setup

- **Node.js** — install it on the runner (`actions/setup-node`, the `node:20` image, `NodeTool@0` on Azure). Examples below use Node 20.
- **Headless** — `codecept.conf.js` must contain `setHeadlessWhen(process.env.HEADLESS || process.env.CI)`. `codeceptjs init` adds it; since CI sets `CI=true`, the suite runs headless automatically.

  ```js
  import { setHeadlessWhen } from '@codeceptjs/configure'

  setHeadlessWhen(process.env.HEADLESS || process.env.CI)
  ```

  Override the browser or viewport per run with the [`browser` plugin](/plugins#browser): `-p browser:browser=firefox:windowSize=1280x1024`.
- **Artifacts** — enable the on-failure capture plugins:

  ```js
  plugins: {
    screenshot: { enabled: true },          // screenshot on failure
    pageInfo:   { enabled: true },          // page URL, HTML errors, console logs
    aiTrace:    { enabled: true, on: 'fail' }, // AI-friendly trace.md
  }
  ```

  [`screencast`](/plugins#screencast) records video of failed tests (Playwright). Everything lands in `output/` — upload that directory as a build artifact. Every example below does.

## Browsers and drivers

- **Playwright** — `npx playwright install --with-deps`. Docs: [Playwright CI](https://playwright.dev/docs/ci), [Playwright Docker image](https://playwright.dev/docs/docker) (pin the tag to your installed `playwright` version).
- **WebDriver** — nothing to provision. WebdriverIO 9 downloads and starts both the browser (Chrome, Chromium, or Firefox) and the matching driver automatically. No Selenium server, no browser-install step. Docs: [WebDriver helper](/webdriver), [WebdriverIO driver/browser management](https://webdriver.io/docs/driverbinaries/).

## Check before running

`npx codeceptjs check` loads the config, opens the browser, and counts tests. Prepend it so a broken environment fails fast with a clear message:

```bash
npx codeceptjs check
npx codeceptjs run
```

Every CI example below does this.

## Parallel execution

- `npx codeceptjs run` — one process.
- `npx codeceptjs run-workers 4` — parallel on one machine, tests handed to workers dynamically.
- `npx codeceptjs run --shard 1/4` — split the suite across CI matrix jobs (one shard per machine).

Shards and workers combine. Full reference: [Parallel Execution](/parallel).

## Reporting

Use [`@testomatio/reporter`](https://github.com/testomatio/reporter). It ships pipes that publish results into GitHub PR checks, GitLab merge-request widgets, and Bitbucket pipeline reports. [See Reporting](/reports).

## CI examples

Each example uses Playwright by default; a WebDriver variant follows where it differs. WebdriverIO 9 downloads its own browser and driver, so the WebDriver variants run on a plain `node:20` image with no Selenium service and no browser-install step. For Playwright, a `node:20` base image plus `npx playwright install --with-deps` keeps these configs free of version pins.

### GitHub Actions — Playwright

`.github/workflows/tests.yml`:

```yaml
name: Tests
on:
  push:
    branches: [main]
  pull_request:

env:
  FORCE_COLOR: 1

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx codeceptjs check
      - run: npx codeceptjs run-workers 4 --by pool
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: codeceptjs-output
          path: output/
```

### GitHub Actions — WebDriver

WebdriverIO 9 downloads its own browser and driver, so the job is just `npm ci` + run — no Selenium service, no browser-install step. This mirrors [WebdriverIO's own boilerplate CI](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml).

```yaml
name: WebDriver Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      FORCE_COLOR: 1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx codeceptjs check
      - run: npx codeceptjs run-workers 2 --by pool
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: codeceptjs-output
          path: output/
```

### GitHub Actions — sharded matrix

Each shard runs on its own runner in parallel:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: ['1/4', '2/4', '3/4', '4/4']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx codeceptjs check
      - run: npx codeceptjs run --shard ${{ matrix.shard }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: output-${{ strategy.job-index }}
          path: output/
```

### GitHub Actions — browser matrix

Run the same suite across browsers and viewports via the [`browser` plugin](/plugins#browser) (`npm i --save-dev @codeceptjs/configure`):

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - { browser: chromium, size: 1920x1080 }
          - { browser: firefox,  size: 1366x768 }
          - { browser: webkit,   size: 414x896 }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx codeceptjs check
      - run: npx codeceptjs run -p browser:browser=${{ matrix.browser }}:windowSize=${{ matrix.size }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: output-${{ matrix.browser }}-${{ matrix.size }}
          path: output/
```

### GitLab CI

`.gitlab-ci.yml`:

```yaml
stages: [test]

playwright:
  stage: test
  image: node:20
  variables:
    FORCE_COLOR: "1"
  parallel: 4
  before_script:
    - npm ci
    - npx playwright install --with-deps chromium
  script:
    - npx codeceptjs check
    - npx codeceptjs run --shard $CI_NODE_INDEX/$CI_NODE_TOTAL
  artifacts:
    when: on_failure
    paths: [output/]
    expire_in: 1 week

webdriver:
  stage: test
  image: node:20  # WebdriverIO 9 downloads its own browser and driver
  script:
    - npm ci
    - npx codeceptjs check
    - npx codeceptjs run-workers 2 --by pool
  artifacts:
    when: on_failure
    paths: [output/]
```

`$CI_NODE_INDEX` is 1-based — it maps directly to CodeceptJS's `--shard` index.

### Bitbucket Pipelines

`bitbucket-pipelines.yml`:

```yaml
image: node:20

definitions:
  caches:
    playwright: ~/.cache/ms-playwright

pipelines:
  default:
    - parallel:
        - step:
            name: Playwright — shard 1/2
            caches: [node, playwright]
            script:
              - npm ci
              - npx playwright install --with-deps chromium
              - npx codeceptjs check
              - npx codeceptjs run --shard 1/2
            artifacts: [output/**]
        - step:
            name: Playwright — shard 2/2
            caches: [node, playwright]
            script:
              - npm ci
              - npx playwright install --with-deps chromium
              - npx codeceptjs check
              - npx codeceptjs run --shard 2/2
            artifacts: [output/**]
```

For WebDriver, no Selenium service or browser image is needed — WebdriverIO 9 downloads its own browser and driver:

```yaml
image: node:20

pipelines:
  default:
    - step:
        script:
          - npm ci
          - npx codeceptjs check
          - npx codeceptjs run-workers 2 --by pool
        artifacts: [output/**]
```

### Jenkins

`Jenkinsfile` (declarative pipeline):

```groovy
pipeline {
  agent {
    docker {
      image 'node:20'
      args '-u root'
    }
  }
  environment {
    FORCE_COLOR = '1'
  }
  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install --with-deps chromium'
      }
    }
    stage('Test') {
      parallel {
        stage('Shard 1/4') { steps { sh 'npx codeceptjs check && npx codeceptjs run --shard 1/4' } }
        stage('Shard 2/4') { steps { sh 'npx codeceptjs check && npx codeceptjs run --shard 2/4' } }
        stage('Shard 3/4') { steps { sh 'npx codeceptjs check && npx codeceptjs run --shard 3/4' } }
        stage('Shard 4/4') { steps { sh 'npx codeceptjs check && npx codeceptjs run --shard 4/4' } }
      }
    }
  }
  post {
    failure {
      archiveArtifacts artifacts: 'output/**', allowEmptyArchive: true
    }
  }
}
```

For WebDriver, keep the same `node:20` agent — WebdriverIO 9 downloads its own browser and driver, so no Selenium container is needed:

```groovy
stage('Test') {
  steps {
    sh 'npx codeceptjs check'
    sh 'npx codeceptjs run-workers 2 --by pool'
  }
}
```

### CircleCI

`.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/node:20.18-browsers
    parallelism: 4
    steps:
      - checkout
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx codeceptjs check
      - run:
          name: Run shard
          command: |
            INDEX=$((CIRCLE_NODE_INDEX + 1))
            npx codeceptjs run --shard ${INDEX}/${CIRCLE_NODE_TOTAL}
      - store_artifacts:
          path: output

  webdriver:
    docker:
      # WebdriverIO 9 downloads its own browser and driver
      - image: cimg/node:20.18
    steps:
      - checkout
      - run: npm ci
      - run: npx codeceptjs check
      - run: npx codeceptjs run-workers 2 --by pool
      - store_artifacts:
          path: output

workflows:
  test:
    jobs:
      - test
      - webdriver
```

`CIRCLE_NODE_INDEX` is 0-based, so add 1 to match CodeceptJS's 1-based `--shard` index.

### Azure Pipelines

`azure-pipelines.yml`:

```yaml
trigger: [main]

pool:
  vmImage: ubuntu-latest

strategy:
  parallel: 4

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  - script: npm ci
    displayName: Install dependencies
  - script: npx playwright install --with-deps chromium
    displayName: Install browsers
  - script: npx codeceptjs check
    displayName: Check setup
  - script: npx codeceptjs run --shard $(System.JobPositionInPhase)/$(System.TotalJobsInPhase)
    displayName: Run shard $(System.JobPositionInPhase)/$(System.TotalJobsInPhase)
    env:
      FORCE_COLOR: 1
  - task: PublishBuildArtifacts@1
    condition: failed()
    inputs:
      pathToPublish: output
      artifactName: codeceptjs-output-$(System.JobPositionInPhase)
```

For WebDriver, no extra setup is needed — WebdriverIO 9 downloads its own browser and driver:

```yaml
  - script: |
      npx codeceptjs check
      npx codeceptjs run-workers 2 --by pool
    displayName: Run tests
```

## Docker

The official `codeceptjs/codeceptjs` image runs Playwright, Puppeteer, and WebDriver suites with no extra setup. Pass runner flags through `CODECEPT_ARGS` and the worker count through `NO_OF_WORKERS`. See [Docker](/docker).

## See also

- [Playwright CI guide](https://playwright.dev/docs/ci) · [Playwright Docker image](https://playwright.dev/docs/docker)
- [WebdriverIO driver management](https://webdriver.io/blog/2023/07/31/driver-management/)
- [Parallel Execution](/parallel) · [Reports](/reports) · [Plugins](/plugins) · [Docker](/docker)

## Community recipes

- [CodeceptJS — Codefresh Integration](https://codecept.discourse.group/t/codeceptjs-codefresh-integration/)
- [CodeceptJS — GitLab Integration](https://codecept.discourse.group/t/codeceptjs-gitlab-integration/)
- [CodeceptJS — Jenkins Integration](https://codecept.discourse.group/t/codeceptjs-jenkins-integration/)
- [CodeceptJS — TeamCity Integration](https://codecept.discourse.group/t/codeceptjs-integration-with-teamcity/)

Got a setup that works for you? [Share your recipe](https://codecept.discourse.group/c/CodeceptJS-issues-in-general/ci/9) and we will list it here.
