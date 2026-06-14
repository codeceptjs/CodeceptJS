// Regression test for https://github.com/codeceptjs/CodeceptJS/issues/5635
// Importing the internal API (config) through a CommonJS loader (tsx/cjs) used to load
// a second, disconnected copy of config.js whose module-scoped `config` was an empty
// object, so `config.get()` returned {} from tests/page objects/fragments while helpers
// (loaded via import(), the ESM realm) saw the real config. The relative path is loaded
// as CJS here while the runner loads the same module as ESM, reproducing the split that
// the globalThis bridge fixes.
import ConfigModule from "../../../lib/config.js";

const Config = (ConfigModule as any).default || ConfigModule;

Feature("config under tsx/cjs");

Scenario("config.get() reads the live config from a test", ({ I }) => {
  console.log(`CONFIG_FROM_TEST name=${Config.get("name")}`);
  console.log(`CONFIG_FROM_TEST marker=${Config.get().helpers.ConfigHelper.marker}`);
  I.reportConfig();
});
