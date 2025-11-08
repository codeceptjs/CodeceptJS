import assert from 'assert';

Feature('Fix for issue #5066: Unable to inject data between workers because of proxy object');

Scenario('Basic share and inject functionality', () => {
  console.log('Testing basic share() and inject() functionality...');
  
  // This is the basic pattern that should work after the fix
  const originalData = { message: 'Hello', count: 42 };
  share(originalData);
  
  const injectedData = inject();
  console.log('Shared data keys:', Object.keys(originalData));
  console.log('Injected data keys:', Object.keys(injectedData));
  
  // These assertions should pass after the fix
  assert.strictEqual(injectedData.message, 'Hello', 'String property should be accessible');
  assert.strictEqual(injectedData.count, 42, 'Number property should be accessible');
  
  console.log('✅ SUCCESS: Basic share/inject works!');
});

Scenario('Complex nested data structures', () => {
  console.log('Testing complex nested data sharing...');
  
  const testDataJson = {
    users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }],
    settings: { theme: 'dark', language: 'en' }
  };
  
  share({ testDataJson });
  
  const data = inject();
  
  // These should work after the fix
  assert(data.testDataJson, 'testDataJson should be accessible');
  assert(Array.isArray(data.testDataJson.users), 'users should be an array');
  assert.strictEqual(data.testDataJson.users[0].name, 'John', 'Should access nested user data');
  assert.strictEqual(data.testDataJson.settings.theme, 'dark', 'Should access nested settings');
  
  console.log('✅ SUCCESS: Complex nested data works!');
});
