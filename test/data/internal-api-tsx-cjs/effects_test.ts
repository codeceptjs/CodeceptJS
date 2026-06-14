// Effects regression under tsx/cjs (originally https://github.com/codeceptjs/CodeceptJS/issues/5632,
// first addressed in PR #5634). within/tryTo/hopeThat/retryTo are part of the internal API and
// delegate to the recorder/container singletons. Imported through a CommonJS loader (tsx/cjs) they
// used to load a second, disconnected copy: tryTo/hopeThat returned without running their callback,
// within skipped its inner steps, and retryTo hung forever.
//
// With the singletons shared at the source (lib/realm.js, #5635) the CJS copy of effects.js resolves
// the live recorder/container, so all four run. Kept as dedicated coverage so a future regression that
// re-splits the recorder/container fails here too.
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

// Kept last on purpose: when the recorder is disconnected, retryTo never resolves and hangs,
// so the earlier markers are already flushed before the runner-test timeout fires.
Scenario("retryTo runs the callback until it succeeds", async ({ I }) => {
  await retryTo(() => {
    I.flaky();
  }, 3);
  console.log("EFFECTS_RETRY done");
});
