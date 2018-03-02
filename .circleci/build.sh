#!/usr/bin/env bash

set -e

cd test

docker-compose build \
  --build-arg NODE_VERSION=$NODE_VERSION \
  test-acceptance.webdriverio \
  test-acceptance.nightmare \
  test-acceptance.puppeteer \
  json_server

docker-compose pull \
  php \
  selenium.chrome
