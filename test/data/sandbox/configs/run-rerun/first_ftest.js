/* eslint-disable radix */
Feature('Run Rerun - Command');

Scenario('@RunRerun - Fail all attempt', ({ I }) => {
  I.printMessage('RunRerun');
  throw new Error('Test Error');
});


Scenario('@RunRerun - fail second test', ({ I }) => {
  I.printMessage('RunRerun');
  process.env.FAIL_ATTEMPT = parseInt(process.env.FAIL_ATTEMPT) + 1;
  console.log(process.env.FAIL_ATTEMPT);
  if (process.env.FAIL_ATTEMPT === '2') {
    throw new Error('Test Error');
  }
});
