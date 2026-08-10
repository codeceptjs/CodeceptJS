export const config = {
  tests: './*_test.js',
  output: './output',
  name: 'typescript-config-dynamic-import',
}

// Lifecycle hooks commonly pull heavy modules lazily. The specifier is extensionless,
// as TypeScript sources are normally written.
export async function runTeardown(): Promise<string> {
  const { teardown } = await import('./lifecycle/teardown')
  return teardown()
}
