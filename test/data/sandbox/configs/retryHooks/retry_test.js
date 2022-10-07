Feature('Retry hooks');

let i = 0;

Before(({ I }) => {
  console.log('ok', i, new Date());
  if (i < 3) throw new Error('not works');
  i++;
});

Scenario('works', () => {
  console.log('works');
});
