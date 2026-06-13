// Regression test for https://github.com/codeceptjs/CodeceptJS/issues/5632
// Importing effects through a CommonJS loader (tsx/cjs) used to load a second,
// disconnected copy of recorder/container, so within() and tryTo() silently did
// nothing. The relative path is loaded as CJS here while the runner loads the same
// module as ESM, reproducing the dual-instance split that the globalThis bridge fixes.
import { within, tryTo, hopeThat, retryTo } from "../../../lib/effects.js";

Feature("effects under tsx/cjs");

Scenario("tryTo executes the failing step and returns false", async ({ I }) => {
  const ok = await tryTo(() => {
    I.seeMissing();
  });
  console.log(`EFFECTS_TRYTO result=${ok}`);
});

Scenario("within applies the context to inner steps", ({ I }) => {
  within("body", () => {
    I.clickInside();
  });
});

Scenario("hopeThat executes the soft assertion and returns true", async ({ I }) => {
  const ok = await hopeThat(() => {
    I.pass();
  });
  console.log(`EFFECTS_HOPETHAT result=${ok}`);
});

// Kept last on purpose: when the recorder is disconnected, retryTo never resolves
// and hangs, so the earlier markers are already flushed before the timeout fires.
Scenario("retryTo runs the callback until it succeeds", async ({ I }) => {
  await retryTo(() => {
    I.flaky();
  }, 3);
  console.log("EFFECTS_RETRY done");
});
