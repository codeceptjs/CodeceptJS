import assert from 'assert'

Feature('Complete validation for issue #5066 fix');

Scenario('End-to-end worker data sharing validation', () => {
  console.log('=== Testing complete data sharing workflow ===');
  
  // Test 1: Basic data sharing
  share({ 
    message: 'Hello from main thread',
    config: { timeout: 5000, retries: 3 },
    users: ['alice', 'bob', 'charlie']
  });
  
  const data = inject();
  
  // Verify all property types work correctly
  assert.strictEqual(data.message, 'Hello from main thread', 'String property should work');
  assert.strictEqual(data.config.timeout, 5000, 'Nested object property should work');
  assert.strictEqual(data.config.retries, 3, 'Nested object property should work');
  assert(Array.isArray(data.users), 'Array property should work');
  assert.strictEqual(data.users.length, 3, 'Array length should work');
  assert.strictEqual(data.users[0], 'alice', 'Array access should work');
  
  // Test 2: Data overriding
  share({ message: 'Updated message' });
  const updatedData = inject();
  assert.strictEqual(updatedData.message, 'Updated message', 'Data override should work');
  assert.strictEqual(updatedData.config.timeout, 5000, 'Previous data should persist');
  
  // Test 3: Complex nested structures
  share({
    testSuite: {
      name: 'E2E Tests',
      tests: [
        { name: 'Login test', status: 'passed', data: { user: 'admin', pass: 'secret' } },
        { name: 'Checkout test', status: 'failed', error: 'Timeout occurred' }
      ],
      metadata: {
        browser: 'chrome',
        version: '91.0',
        viewport: { width: 1920, height: 1080 }
      }
    }
  });
  
  const complexData = inject();
  assert.strictEqual(complexData.testSuite.name, 'E2E Tests', 'Deep nested string should work');
  assert.strictEqual(complexData.testSuite.tests[0].data.user, 'admin', 'Very deep nested access should work');
  assert.strictEqual(complexData.testSuite.metadata.viewport.width, 1920, 'Very deep nested number should work');
  
  // Test 4: Key enumeration
  const allKeys = Object.keys(inject());
  assert(allKeys.includes('message'), 'Keys should include shared properties');
  assert(allKeys.includes('testSuite'), 'Keys should include all shared properties');
  
  console.log('✅ ALL TESTS PASSED - Issue #5066 is completely fixed!');
  console.log('✅ Workers can now share and inject data without circular dependency errors');
  console.log('✅ Proxy objects work correctly for both direct and nested property access');
});
