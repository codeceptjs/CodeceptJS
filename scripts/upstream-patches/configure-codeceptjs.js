// Replacement for @codeceptjs/configure/codeceptjs.js
//
// CodeceptJS handle, looked up from the in-process registry the framework sets
// on globalThis. Avoids a top-level `import 'codeceptjs'`, which fails to
// resolve inside the codeceptjs repo's own CI (the project IS the codeceptjs
// package). Each named export is a Proxy that forwards property access to the
// live framework module at call time, so hooks register against the same
// singletons the runner is using.

function lazy(name) {
  return new Proxy({}, {
    get(_, key) {
      const cjs = globalThis.codeceptjs
      if (!cjs) {
        throw new Error('CodeceptJS host not available — call configure functions from inside a codecept.conf.js / codecept run, or make sure CodeceptJS >= 4.0 is loaded first.')
      }
      const target = cjs[name]
      if (!target) {
        throw new Error(`CodeceptJS does not expose ${name} on the host registry.`)
      }
      const v = target[key]
      return typeof v === 'function' ? v.bind(target) : v
    },
  })
}

const codeceptjs = new Proxy({}, {
  get(_, key) {
    const cjs = globalThis.codeceptjs
    if (!cjs) throw new Error('CodeceptJS host not available — call configure functions from inside a codecept.conf.js / codecept run.')
    return cjs[key]
  },
})

export default codeceptjs
export const config = lazy('config')
export const container = lazy('container')
export const event = lazy('event')
export const output = lazy('output')
