const { I } = inject();

Feature("Stale test");

/**
 * Retry on config is not the same at retry on test
 */

let tries = 0;


Scenario('Rejected promise stale the process', async ({ I }) => {
  // I.say('hey')
  await new Promise((resolve, reject) => setTimeout(reject("@@@Flaky error"), 500));
})

Scenario("Try to stale flaky test", async () => {
  tries++;
  throw new Error("@@@Flaky error");
  // await new Promise((resolve) => setTimeout(() => {
  // }, 500));
})

Scenario("2 - Try to stale flaky test", async () => {
  tries++;
  setTimeout(() => {
    throw new Error("@@@Flaky error");
  }, 500);
  await new Promise((resolve) => setTimeout(resolve, 300));
  throw new Error("@@@Flaky error");
}).retry(2);


// // Works but we don't know why on retry(1)
Scenario("3 - Try to stale flaky test", async () => {
  tries++;
  setTimeout(() => {
    throw new Error("@@@Flaky error");
  }, 500);
  await new Promise((resolve) => setTimeout(resolve, 701));
}).retry(1);

// // Lead to error "done() multiple time" because error is throw at the same time that test is over
Scenario("4 - Try to stale flaky test", async () => {
  tries++;
  setTimeout(() => {
    throw new Error("@@@Flaky error");
  }, 500);
  await new Promise((resolve) => setTimeout(resolve, 500));
});


After(() => {
  console.log(`[T] Retries: ${tries}`);
});
