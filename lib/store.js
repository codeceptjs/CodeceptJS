/**
 * Global store for current session
 * @namespace
 */
const store = {
  // --- Required (set once via initialize(), immutable after) ---

  /** @type {string | null} */
  codeceptDir: null,
  /** @type {string | null} */
  outputDir: null,
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

  /**
   * Initialize required store fields.
   * These values cannot be overwritten after initialization.
   * @param {object} opts
   * @param {string} opts.codeceptDir - root directory of tests
   * @param {string} opts.outputDir - resolved output directory
   * @param {boolean} [opts.workerMode=false] - running in worker mode
   */
  initialize(opts) {
    if (!opts.codeceptDir) throw new Error('codeceptDir is required')
    if (!opts.outputDir) throw new Error('outputDir is required')

    this.codeceptDir = opts.codeceptDir
    this.outputDir = opts.outputDir
    // workerMode may be set before initialize() by command entry points
    if (opts.workerMode !== undefined) this.workerMode = opts.workerMode

    Object.defineProperty(this, 'codeceptDir', { value: opts.codeceptDir, writable: false, configurable: false })
    Object.defineProperty(this, 'outputDir', { value: opts.outputDir, writable: false, configurable: false })
    Object.defineProperty(this, 'workerMode', { value: this.workerMode, writable: false, configurable: false })
  },
}

export default store
