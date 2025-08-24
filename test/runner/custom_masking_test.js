const { expect } = require('expect')
const exec = require('child_process').exec
const { assert } = require('chai')

describe('Custom Masking Integration Tests', () => {
  const config_run_config = config => `node ./bin/codecept.js run --config test/data/sandbox/${config}`

  it('should mask custom patterns in debug mode', done => {
    exec(config_run_config('codecept.bdd.masking.js') + ' --debug --grep "Custom Data Masking"', (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)

      // Check that the step descriptions are masked (these go through CodeceptJS output)
      stdout.should.include('I have user email "[MASKED_EMAIL]"')
      stdout.should.include('I have credit card "[MASKED_CARD]"')
      stdout.should.include('I have phone number "[MASKED_PHONE]"')

      // Check that CodeceptJS debug output is masked
      stdout.should.include('I debug "User email is: [MASKED_EMAIL]"')
      stdout.should.include('I debug "Credit card is: [MASKED_CARD]"')
      stdout.should.include('I debug "Phone number is: [MASKED_PHONE]"')

      assert(!err)
      done()
    })
  })

  it('should mask custom patterns in regular run mode', done => {
    exec(config_run_config('codecept.bdd.masking.js') + ' --grep "Custom Data Masking"', (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)

      // In regular mode, we should still see the step names are present and test passes
      stdout.should.include('✔ mask custom sensitive data in output')

      assert(!err)
      done()
    })
  })
})
