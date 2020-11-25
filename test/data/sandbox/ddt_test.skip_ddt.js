Feature('SkipDDT');

xData(function* () {
  yield { user: 'bob' };
  yield { user: 'anne' };
}).Scenario('Should add skip entry for each item', ({ current }) => {
  console.log(`I am ${current.user}`);
});
