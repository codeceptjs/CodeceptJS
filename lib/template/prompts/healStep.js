export default (html, { step, error, prevSteps }) => {
  return [
    {
      role: 'user',
      content: `As a test automation engineer I am testing web application using CodeceptJS.
      I want to heal a test that fails. Here is the list of executed steps: ${prevSteps.map(s => s.toString()).join(', ')}
      Propose how to adjust ${step.toCode()} step to fix the test.
      Use locators in order of preference: semantic locator by text, CSS, XPath. Use codeblocks marked with \`\`\`
      Here is the error message: ${error.message}
      Here is HTML code of a page where the failure has happened: \n\n${html}`,
    },
  ]
}
