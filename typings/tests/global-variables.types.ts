import { expectError, expectType } from 'tsd';


expectError(Feature());
expectError(Scenario());
expectError(Before());
expectError(BeforeSuite());
expectError(After());
expectError(AfterSuite());

// @ts-ignore
expectType<CodeceptJS.FeatureConfig>(Feature('feature'))

// @ts-ignore
expectType<CodeceptJS.ScenarioConfig>(Scenario('scenario'))

// @ts-ignore
expectType<CodeceptJS.ScenarioConfig>(Scenario(
  'scenario',
  {}, // $ExpectType {}
  () => {} // $ExpectType () => void
))

// @ts-ignore
expectType<CodeceptJS.ScenarioConfig>(Scenario(
  'scenario',
  () => {} // $ExpectType () => void
))

// @ts-ignore
const callback: CodeceptJS.HookCallback = () => {}

// @ts-ignore
expectType<CodeceptJS.ScenarioConfig>(Scenario(
  'scenario',
  callback // $ExpectType HookCallback
))

// @ts-ignore
expectType<CodeceptJS.ScenarioConfig>(Scenario('scenario',
  (args) => {
    // @ts-ignore
    expectType<CodeceptJS.SupportObject>(args)
    // @ts-ignore
    expectType<CodeceptJS.I>(args.I) // $ExpectType I
  }
))

// @ts-ignore
expectType<CodeceptJS.ScenarioConfig>(Scenario(
  'scenario',
  async () => {} // $ExpectType () => Promise<void>
))

// @ts-ignore
expectType<void>(Before((args) => {
  // @ts-ignore
  expectType<CodeceptJS.SupportObject>(args)
  // @ts-ignore
  expectType<CodeceptJS.I>(args.I)
}))

// @ts-ignore
expectType<void>(BeforeSuite((args) => {
  // @ts-ignore
  expectType<CodeceptJS.SupportObject>(args)
  // @ts-ignore
  expectType<CodeceptJS.I>(args.I)
}))

// @ts-ignore
expectType<void>(After((args) => {
  // @ts-ignore
  expectType<CodeceptJS.SupportObject>(args)
  // @ts-ignore
  expectType<CodeceptJS.I>(args.I)
}))

// @ts-ignore
expectType<void>(AfterSuite((args) => {
  // @ts-ignore
  expectType<CodeceptJS.SupportObject>(args)
  // @ts-ignore
  expectType<CodeceptJS.I>(args.I)
}))
