export const config = {
  tests: './tests/*Test.ts',
  helpers: {
    FakeHelper: {
      require: './fakeHelper.js',
    },
  },
  include: {
    fooPage: './pages/fooPage.ts',
  },
  require: ['tsx/cjs'],
  name: 'typescript-step-paths',
}
