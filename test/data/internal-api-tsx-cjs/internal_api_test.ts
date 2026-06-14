// Regression test for https://github.com/codeceptjs/CodeceptJS/issues/5635
// The internal API (https://codecept.io/architecture#the-internal-api) is supposed to work
// from tests, page objects and fragments — not only helpers. But test files are loaded via
// Mocha's synchronous require() (the CommonJS realm) under a CJS loader such as tsx/cjs,
// while the framework runs as native ESM. So importing the internal API from a test used to
// load a second, disconnected CJS copy of each singleton: config.get() returned {}, the
// container had no helpers, the recorder was never started and the event dispatcher had no
// listeners. Helpers were unaffected because they load via import() (the ESM realm).
//
// Each singleton below is now shared across realms (see lib/realm.js), so the test reads the
// very instances the runner operates on.
import { config, container, recorder, event, store } from "../../../lib/index.js";

Feature("internal API under tsx/cjs");

Scenario("internal API resolves the live singletons from a test", ({ I }) => {
  // config — the value the runner loaded, not an empty {}
  console.log(`API_CONFIG name=${config.get("name")}`);
  console.log(`API_CONFIG marker=${config.get().helpers.ConfigHelper.marker}`);
  // container — the live helpers map the runner populated
  console.log(`API_CONTAINER helper=${typeof container.helpers("ConfigHelper")}`);
  // store — initialized by the runner
  console.log(`API_STORE hasDir=${Boolean(store.codeceptDir)}`);
  // recorder — started by the runner for this test (would be false on a disconnected copy)
  console.log(`API_RECORDER running=${recorder.isRunning()}`);
  // event — the live dispatcher the framework subscribes to (a disconnected copy has none)
  console.log(`API_EVENT live=${event.dispatcher.eventNames().length > 0}`);
  I.reportConfig();
});
