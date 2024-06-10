Feature('Scenario should not be staling');

const SHOULD_NOT_STALE = 'should not stale scenario error';

Scenario('Rejected promise should not stale the process', async () => {
  await new Promise((_resolve, reject) => setTimeout(reject(new Error(SHOULD_NOT_STALE)), 500));
});

Scenario('Should handle throw inside synchronous and terminate gracefully', () => {
  throw new Error(SHOULD_NOT_STALE);
});
Scenario('Should handle throw inside async and terminate gracefully', async () => {
  throw new Error(SHOULD_NOT_STALE);
});

Scenario('Should throw, retry and keep failing', async () => {
  setTimeout(() => {
    throw new Error(SHOULD_NOT_STALE);
  }, 500);
  await new Promise((resolve) => setTimeout(resolve, 300));
  throw new Error(SHOULD_NOT_STALE);
}).retry(2);
