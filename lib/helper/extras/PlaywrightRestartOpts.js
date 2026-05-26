const RESTART_OPTS = {
  session: 'keep',
  context: false,
  browser: true,
}

let restarts = null

export function setRestartStrategy(options) {
  const { restart } = options
  const stringOpts = Object.keys(RESTART_OPTS)

  if (stringOpts.includes(restart)) {
    return (restarts = restart)
  }

  // When restart is false, don't restart anything
  if (restart === false) {
    restarts = null
    return
  }

  // When restart is true, map to 'browser' restart
  if (restart === true) {
    restarts = 'browser'
    return
  }

  restarts = Object.keys(RESTART_OPTS).find(key => RESTART_OPTS[key] === restart)

  if (restarts === null || restarts === undefined) throw new Error('No restart strategy set, use the following values for restart: session, context, browser')
}

export function restartsSession() {
  return restarts === 'session'
}

export function restartsContext() {
  return restarts === 'context'
}

export function restartsBrowser() {
  return restarts === 'browser'
}
