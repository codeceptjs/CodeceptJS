enum Role {
  Admin,
  User,
}

Feature('enum')

Scenario('enum', ({ I }) => {
  I.wait(Role.Admin)
  I.wait(3)
})
