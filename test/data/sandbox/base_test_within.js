Feature('Within');

Scenario('Check within without generator', (I) => {
  I.smallPromise();
  within('blabla', () => {
    I.smallPromise();
  });
});

Scenario('Check within with generator. Yield is first in order', function* (I){
  I.smallPromise();
  let test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    let testwithin = yield I.smallYield();
    console.log(testwithin);
    I.smallPromise();
  });
});

Scenario('Check within with generator. Yield is second in order', function* (I){
  I.smallPromise();
  let test = yield I.smallYield();
  console.log(test)
  within('blabla', function* () {
    I.smallPromise();
    let testwithin = yield I.smallYield();
    console.log(testwithin);
  });
});

Scenario('Check within with generator. Should complete test steps after within', function* (I){
  let test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    let testwithin = yield I.smallYield();
    console.log(testwithin);
    I.smallPromise();
  });
  I.smallPromise();
});

Scenario('Check within with generator. Should stop test execution after fail in within', function* (I){
  let test = yield I.smallYield();
  console.log(test);
  within('blabla', function* () {
    I.errorStep();
    let testwithin = yield I.smallYield();
    console.log(testwithin);
    I.smallPromise();
  });
  I.smallPromise();
});

Scenario('Check within with generator. Should stop test execution after fail in main block', function* (I){
  I.errorStep();
  within('blabla', function* () {
    I.errorStep();
    let testwithin = yield I.smallYield();
    console.log(testwithin);
    I.smallPromise();
  });
  I.smallPromise();
});

