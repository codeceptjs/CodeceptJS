#!/usr/bin/env bash

set -e

cd test

docker-compose run --rm test-unit &&
docker-compose run --rm test-rest &&
docker-compose run --rm test-acceptance.webdriverio &&
docker-compose run --rm test-acceptance.nightmare &&
docker-compose run --rm test-acceptance.puppeteer
