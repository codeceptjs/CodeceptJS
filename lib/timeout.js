const TIMEOUT_ORDER = {
  /**
   * timeouts set with order below zero only override timeouts of higher order if their value is smaller
   */
  testOrSuite: -5,
  /**
   * 0-9 - designated for override of timeouts set from code, 5 is used by stepTimeout plugin when stepTimeout.config.overrideStepLimits=true
   */
  stepTimeoutHard: 5,
  /**
   * 10-19 - designated for timeouts set from code, 15 is order of I.setTimeout(t) operation
   */
  codeLimitTime: 15,
  /**
   * 20-29 - designated for timeout settings which could be overriden in tests code, 25 is used by stepTimeout plugin when stepTimeout.config.overrideStepLimits=false
   */
  stepTimeoutSoft: 25,
}

function getCurrentTimeout(timeouts) {
  let totalTimeout
  // iterate over all timeouts starting from highest values of order
  new Map([...timeouts.entries()].sort().reverse()).forEach((timeout, order) => {
    if (
      timeout !== undefined &&
      // when orders >= 0 - timeout value overrides those set with higher order elements
      (order >= 0 ||
        // when `order < 0 && totalTimeout === undefined` - timeout is used when nothing is set by elements with higher order
        totalTimeout === undefined ||
        // when `order < 0` - timeout overrides higher values of timeout or 'no timeout' (totalTimeout === 0) set by elements with higher order
        (timeout > 0 && (timeout < totalTimeout || totalTimeout === 0)))
    ) {
      totalTimeout = timeout
    }
  })
  return totalTimeout
}

class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

class TestTimeoutError extends TimeoutError {
  constructor(timeout) {
    super(`Timeout ${timeout}s exceeded (with Before hook)`)
    this.name = 'TestTimeoutError'
  }
}

class StepTimeoutError extends TimeoutError {
  constructor(timeout, step) {
    super(`Step ${step.toCode().trim()} timed out after ${timeout}s`)
    this.name = 'StepTimeoutError'
  }
}

module.exports = {
  TIMEOUT_ORDER,
  getCurrentTimeout,
  TimeoutError,
  TestTimeoutError,
  StepTimeoutError,
}
