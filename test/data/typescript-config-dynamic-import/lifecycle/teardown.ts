import { getSweepLabel } from '../common/labels'

export function teardown(): string {
  return `teardown:${getSweepLabel()}`
}

// Standard CommonJS entrypoint idiom: this module doubles as a CLI script. It must
// survive transpilation (no "require is not defined in ES module scope") and must not
// run when the module is merely imported.
if (require.main === module) {
  console.log(teardown())
}
