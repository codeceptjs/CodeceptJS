async function findByPlaywrightLocator(matcher, locator) {
  const pwLocator = locator.locator || locator
  if (pwLocator && pwLocator.toString && pwLocator.toString().includes(process.env.testIdAttribute)) {
    return matcher.getByTestId(pwLocator.pw.value.split('=')[1])
  }
  const pwValue = typeof pwLocator.pw === 'string' ? pwLocator.pw : pwLocator.pw
  return matcher.locator(pwValue).all()
}

export { findByPlaywrightLocator }
