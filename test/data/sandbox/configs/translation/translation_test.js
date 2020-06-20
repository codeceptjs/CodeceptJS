Caratteristica('DevTo');

Prima(() => {
  console.log('Before');
});

lo_scenario('Simple translation test', () => {
  console.log('Simple test');
});

Scenario('Simple translation test 2', () => {
  console.log('Simple test 2');
});

Dopo(() => {
  console.log('After');
});
