#!/bin/bash

# Test script to debug Playwright timeout issue
# Tests individual files and then all together

echo "=== Testing Playwright with browser restart ==="

# Start servers
echo "Starting servers..."
php -S 127.0.0.1:8000 -t test/data/app > /dev/null 2>&1 &
PHP_PID=$!
npm run json-server > /dev/null 2>&1 &
JSON_PID=$!

sleep 3

# Create config files for individual tests
echo "Creating config files..."
cp test/acceptance/codecept.Playwright.js test/acceptance/codecept.Playwright.within.js
sed -i 's/tests: ".\/\\*_test.js"/tests: ".\/within_test.js"/' test/acceptance/codecept.Playwright.within.js

cp test/acceptance/codecept.Playwright.js test/acceptance/codecept.Playwright.config.js
sed -i 's/tests: ".\/\\*_test.js"/tests: ".\/config_test.js"/' test/acceptance/codecept.Playwright.config.js

# Test individual files
echo "=== Testing within_test.js ==="
timeout 120 env BROWSER_RESTART=browser ./bin/codecept.js run --config test/acceptance/codecept.Playwright.within.js --grep @Playwright --verbose
echo ""

echo "=== Testing config_test.js ==="
timeout 120 env BROWSER_RESTART=browser ./bin/codecept.js run --config test/acceptance/codecept.Playwright.config.js --grep @Playwright --verbose
echo ""

echo "=== Testing both files together ==="
timeout 120 env BROWSER_RESTART=browser ./bin/codecept.js run --config test/acceptance/codecept.Playwright.js --grep @Playwright --verbose --grep "within on form|change config"
echo ""

echo "=== Testing all Playwright tests ==="
timeout 300 env BROWSER_RESTART=browser ./bin/codecept.js run --config test/acceptance/codecept.Playwright.js --grep @Playwright --verbose
echo ""

# Cleanup
echo "Cleaning up..."
kill $PHP_PID $JSON_PID 2>/dev/null
rm -f test/acceptance/codecept.Playwright.within.js test/acceptance/codecept.Playwright.config.js

echo "Done!"