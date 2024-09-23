const RESTART_OPTS = {
  session: 'keep',
  browser: true,
  context: false,
};

let restarts = null;

export function setRestartStrategy(options) {
  const { restart } = options;
  const stringOpts = Object.keys(RESTART_OPTS);

  if (stringOpts.includes(restart)) {
    return restarts = restart;
  }

  restarts = Object.keys(RESTART_OPTS).find(key => RESTART_OPTS[key] === restart);

  if (restarts === null || restarts === undefined) throw new Error('No restart strategy set, use the following values for restart: session, context, browser');
}

export function restartsSession() {
  return restarts === 'session';
}
export function restartsContext() {
  return restarts === 'context';
}
export function restartsBrowser() {
  return restarts === 'browser';
}
