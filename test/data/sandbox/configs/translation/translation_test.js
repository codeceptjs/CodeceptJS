Caratteristica('DevTo');

Prima((I) => {
  console.log('Before');
});


lo_scenario('Simple translation test', (io) => {
  console.log('Simple test');
});

Scenario('Simple translation test 2', (I) => {
  console.log('Simple test 2');
});

Dopo((I) => {
  console.log('After');
});
