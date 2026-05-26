/**
 * Global store for current session
 * @namespace
 */
const store = {
  // --- Required (set once via initialize(), immutable after) ---

  /** @type {string | null} */
  _codeceptDir: null,
  /** @type {string | null} */
  _outputDir: null,

  get codeceptDir() {
    return this._codeceptDir || global.codecept_dir || null
  },
  set codeceptDir(val) {
    this._codeceptDir = val
  },

  get outputDir() {
    return this._outputDir || global.output_dir || null
  },
  set outputDir(val) {
    this._outputDir = val
  },

  /** @type {boolean} */
  workerMode: false,

  // --- Session config (per-session, mutable, set at session start) ---

  /**
   * If we are in --debug mode
   * @type {boolean}
   */
  debugMode: false,

  /**
   * Is timeouts enabled
   * @type {boolean}
   */
  timeouts: true,

  /**
   * If auto-retries are enabled by retryFailedStep plugin
   * tryTo effect disables them
   * @type {boolean}
   */
  autoRetries: false,

  /**
   * Tests are executed via dry-run
   * @type {boolean}
   */
  dryRun: false,

  /**
   * Feature.only() was used
   * @type {boolean}
   */
  featureOnly: false,

  /**
   * Scenario.only() was used
   * @type {boolean}
   */
  scenarioOnly: false,

  /**
   * Mask sensitive data config
   * @type {boolean|object}
   */
  maskSensitiveData: false,

  /**
   * noGlobals mode — user imports everything
   * @type {boolean}
   */
  noGlobals: false,

  // --- State (tracks current execution, changes constantly) ---

  /**
   * If we are in pause mode
   * @type {boolean}
   */
  onPause: false,

  /** @type {CodeceptJS.Test | null} */
  currentTest: null,
  /** @type {CodeceptJS.Step | null} */
  currentStep: null,
  /** @type {CodeceptJS.Suite | null} */
  currentSuite: null,

  /** @type {Map<string, string> | null} */
  tsFileMapping: null,

  /**
   * Initialize required store fields.
   * These values cannot be overwritten after initialization.
   * @param {object} opts
   * @param {string} opts.codeceptDir - root directory of tests
   * @param {string} opts.outputDir - resolved output directory
   */
  initialize(opts) {
    if (!opts.codeceptDir) throw new Error('codeceptDir is required')
    if (!opts.outputDir) throw new Error('outputDir is required')

    this._codeceptDir = opts.codeceptDir
    this._outputDir = opts.outputDir
  },
}

export default store
