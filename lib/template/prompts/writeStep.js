export default (html, input) => [
  {
    role: 'user',
    content: `I am test engineer writing test in CodeceptJS
      I have opened web page and I want to use CodeceptJS to ${input} on this page
      Provide me valid CodeceptJS code to accomplish it
      Use only locators from this HTML: \n\n${html}`,
  },
]
