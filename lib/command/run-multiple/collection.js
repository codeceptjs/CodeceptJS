const { createChunks } = require('./chunk');
const { createRun } = require('./run');

/**
 * Bootstraps a collection of runs, it combines user defined selection of runs 
 * to be executed and retrieves the run-specific configuration 
 */
const createRuns = (selectedRuns, config) => {
  return createCollection(config)
    .prepareRuns(selectedRuns, config)
    .prepareChunks(config)
    .prepareBrowsers(config)
    .filterSelectedBrowsers(selectedRuns, config)
    .getRuns();
};

class Collection {
  constructor(config) {
    this.config = config;
    this.runs = [];
  }

  addRun(run) {
    this.runs.push(run);
  }

  removeRun(name) {
    this.runs.forEach((run, index) => {
      if (run.getName() === name) {
        delete this.runs[index];
        return true;
      }
    });

    // Remove empty items
    this.runs = this.runs.filter(r => !!r);

    return false;
  }

  getRuns() {
    return this.runs;
  }

  /**
   * Expands the list of selected runs to runs incl. configuration from config.multiple.
   */
  prepareRuns (selectedRuns, config) {
    selectedRuns.forEach((selectedRun) => {
      const [runName] = selectedRun.split(':');
      const runConfig = config.multiple[runName];
  
      if (!runConfig) {
          throw new Error(`run ${runName} was not configured in "multiple" section of config`);
      }
  
      this.addRun(createRun(runName, runConfig));
    });

    return this;
  }

  /**
   * Expands runs via the `chunks` property to multiple runs. If config.chunks is a numeric
   * value the list of scenario files is divided by this number. If config.chunks is a function,
   * the function with the list of scenario files itself is called. 
   */
  prepareChunks (config) {
    this.runs.forEach((run) => {
      const runName = run.getName();
      const runConfig = run.getConfig();
      const pattern = run.tests || config.tests;

      if (!runConfig.chunks || !pattern) {
        return;
      }

      createChunks(runConfig, pattern).forEach((runChunkConfig, index) => {
        let run = createRun(`${runName}:chunk${index + 1}`, runChunkConfig);
        run.setOriginalName(runName);
        this.addRun(run);
      });

      this.removeRun(runName);
    });

    return this;
  }

  /**
   * Expands browser declared via `browsers` property to multiple
   * runs that all have one single `browser` property and omits
   * the `browsers` property.
   **/
  prepareBrowsers (config) {
    this.runs.forEach((run) => {
      const runName = run.getName();
      const runConfig = run.getConfig();
      const browsers = [];

      runConfig.browsers.forEach((browser) => {
        const browserConfig = browser.browser ? browser : { browser };
        const runBrowserConfig = { ...runConfig, browser: browserConfig };
        browsers.push(browserConfig.browser);
        const count = browsers.filter((b) => {
          return b === browserConfig.browser;
        }).length;

        delete runBrowserConfig.browsers;

        let run = createRun(`${runName}:${browserConfig.browser}${count}`, runBrowserConfig);
        run.setOriginalName(runName);
        this.addRun(run);
      });

      this.removeRun(runName);
    });

    return this;
  }

  /**
   * Filters all runs by their `browser` property. The property `browsers` is ignored.
   * If value of property `browser` does not match the slected `browser` in conjugation
   * with the selectedRunName then the suite is removed from configuration.
   */
  filterSelectedBrowsers (selectedRuns, config) {
    selectedRuns.forEach((selectedRun) => {
      const [selectedRunName, selectedRunBrowserName] = selectedRun.split(':');

      selectedRuns.forEach((selectedRun) => {
        const [selectedRunName, selectedRunBrowserName] = selectedRun.split(':');
        this.runs.forEach((run) => {
          const runName = run.getName();
          const runConfig = run.getConfig();

          const runBrowserName = runConfig.browser.browser;

          if (selectedRunBrowserName) {
            if (selectedRunName === run.getOriginalName() && selectedRunBrowserName !== runBrowserName) {
              this.removeRun(runName);
            }
          }
        });
      });
    });

    return this;
  }
}

const createCollection = (runs) => {
    return new Collection(runs);
}

module.exports = {
    createRuns
};
