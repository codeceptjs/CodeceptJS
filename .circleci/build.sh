#!/usr/bin/env bash

set -e

cd test

docker-compose build \
  --build-arg NODE_VERSION=$NODE_VERSION \
  test-unit \
  test-helpers \
  test-acceptance.webdriverio \
  test-acceptance.nightmare \
  json_server

docker-compose pull \
  php \
  selenium.chrome
