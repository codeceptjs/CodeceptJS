Feature() // $ExpectError
Scenario() // $ExpectError
Before() // $ExpectError
BeforeSuite() // $ExpectError
After() // $ExpectError
AfterSuite() // $ExpectError

Feature('feature') // $ExpectType FeatureConfig

Scenario('scenario') // $ExpectType ScenarioConfig
Scenario(
  'scenario',
  {}, // $ExpectType {}
  () => {} // $ExpectType () => void
)
Scenario(
  'scenario',
  () => {} // $ExpectType () => void
)
const callback: CodeceptJS.HookCallback = () => {}
Scenario(
  'scenario',
  callback // $ExpectType HookCallback
)
Scenario('scenario',
  (args) => {
    args // $ExpectType SupportObject
    args.I // $ExpectType I
  }
)
Scenario(
  'scenario',
  async () => {} // $ExpectType () => Promise<void>
)

Before((args) => {
  args // $ExpectType SupportObject
  args.I // $ExpectType I
})

BeforeSuite((args) => {
  args // $ExpectType SupportObject
  args.I // $ExpectType I
})

After((args) => {
  args // $ExpectType SupportObject
  args.I // $ExpectType I
})

AfterSuite((args) => {
  args // $ExpectType SupportObject
  args.I // $ExpectType I
})
