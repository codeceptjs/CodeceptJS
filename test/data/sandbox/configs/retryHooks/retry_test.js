Feature('Retry #Before hooks', { retryBefore: 2 });

let i = 0;

Before(({ I }) => {
  console.log('ok', i, new Date());
  i++;
  if (i < 3) throw new Error('not works');
});

Scenario('works', () => {
  console.log('works');
});
