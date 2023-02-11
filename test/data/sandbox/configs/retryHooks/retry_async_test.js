Feature('Retry #Async hooks', { retryBefore: 2 });

let i = 0;

Before(async ({ I }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('ok', i, new Date());
      i++;
      if (i < 3) reject(new Error('not works'));
      resolve();
    }, 0);
  });
});

Scenario('async hook works', () => {
  console.log('works');
});
