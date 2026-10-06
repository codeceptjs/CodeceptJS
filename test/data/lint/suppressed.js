Feature('suppressed')

Scenario('suppressed', ({ I }) => {
  I.wait(1) // codeceptjs-lint-disable-line no-fixed-wait
  // codeceptjs-lint-disable-next-line no-fixed-wait
  I.wait(2)
  I.wait(3) // codeceptjs-lint-disable-line
  I.wait(4) // codeceptjs-lint-disable-line no-pause
})
