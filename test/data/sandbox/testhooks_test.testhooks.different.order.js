Feature('Test hooks');

BeforeSuite(async ({ I }) => {
  const text = await I.asyncStringWithHook('BeforeSuite');
  console.log(text);
});

Before(async ({ I }) => {
  const text = await I.asyncStringWithHook('Before');
  console.log(text);
});

Scenario('Simple test 1', () => {
  console.log('Scenario: It\'s first test');
});

After(async ({ I }) => {
  const text = await I.asyncStringWithHook('After');
  console.log(text);
});

AfterSuite(async ({ I }) => {
  const text = await I.asyncStringWithHook('AfterSuite');
  console.log(text);
});
