Feature('Within');

Scenario('Check within without generator', ({ I }) => {
  I.smallPromise();
  within('blabla', () => {
    I.smallPromise();
  });
});

Scenario('Check within with generator. Yield is first in order', () => {
});

Scenario('Check within with generator. Yield is second in order', () => {
});

Scenario('Check within with generator. Should complete test steps after within', () => {
});

Scenario('Check within with generator. Should stop test execution after fail in within', () => {
});

Scenario('Check within with generator. Should stop test execution after fail in main block', () => {
  throw new Error('fail');
});

Scenario('Check within with async/await. Await is first in order', async ({ I }) => {
  I.smallPromise();
  const test = await I.smallYield();
  console.log(test, 'await');
  within('blabla', async () => {
    const testWithin = await I.smallYield();
    console.log(testWithin, 'await');
    I.smallPromise();
  });
});

Scenario('Check within with async/await. Await is second in order', async ({ I }) => {
  I.smallPromise();
  const test = await I.smallYield();
  console.log(test, 'await');
  within('blabla', async () => {
    I.smallPromise();
    const testWithin = await I.smallYield();
    console.log(testWithin, 'await');
  });
});
