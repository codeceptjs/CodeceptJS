Feature('Retry global config');

let i = 0;

Scenario('#globalRetry works', () => {
  console.log('ok', i, new Date());
  i++;
  if (i < 3) throw new Error('not works');
  console.log('works');
});
