Feature('Within');

Scenario('Check within without generator', (I) => {
  I.smallPromise();
  within('blabla', () => {
    I.smallPromise();
  });
});

Scenario('Check within with generator. Yield is first in order', function* (I) {
  I.smallPromise();
  const test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    const testWithin = yield I.smallYield();
    console.log(testWithin);
    I.smallPromise();
  });
});

Scenario('Check within with generator. Yield is second in order', function* (I) {
  I.smallPromise();
  const test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    I.smallPromise();
    const testWithin = yield I.smallYield();
    console.log(testWithin);
  });
});

Scenario('Check within with generator. Should complete test steps after within', function* (I) {
  const test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    const testWithin = yield I.smallYield();
    console.log(testWithin);
    I.smallPromise();
  });
  I.smallPromise();
});

Scenario('Check within with generator. Should stop test execution after fail in within', function* (I) {
  const test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    I.errorStep();
    const testWithin = yield I.smallYield();
    console.log(testWithin);
    I.smallPromise();
  });
  I.smallPromise();
});

Scenario('Check within with generator. Should stop test execution after fail in main block', function* (I) {
  I.errorStep();
  within('blabla', function* () {
    I.errorStep();
    const testWithin = yield I.smallYield();
    console.log(testWithin);
    I.smallPromise();
  });
  I.smallPromise();
});

