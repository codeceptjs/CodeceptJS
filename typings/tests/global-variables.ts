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

class CustomClass extends Helper {
  constructor(config: any) {
    super(
      config // $ExpectType any
    )
  }
}

// Before((
//   args // $ExpectType string
//   ) => {})
// BeforeSuite() // $ExpectError
// After() // $ExpectError
// AfterSuite() // $ExpectError
