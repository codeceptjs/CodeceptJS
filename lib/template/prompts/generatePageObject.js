export default (html, extraPrompt = '', rootLocator = null) => [
  {
    role: 'user',
    content: `As a test automation engineer I am creating a Page Object for a web application using CodeceptJS.
      Here is an sample page object:

const { I } = inject();

export default {

  // setting locators
  element1: '#selector',
  element2: '.selector',
  element3: locate().withText('text'),

  // setting methods
  doSomethingOnPage(params) {
    // ...
  },
}

      I want to generate a Page Object for the page I provide.
      Write JavaScript code in similar manner to list all locators on the page.
      Use locators in order of preference: by text (use locate().withText()), label, CSS, XPath.
      Avoid TailwindCSS, Bootstrap or React style formatting classes in locators.
      Add methods to interact with page when needed.
      ${extraPrompt}
      ${rootLocator ? `All provided elements are inside '${rootLocator}'. Declare it as root variable and for every locator use locate(...).inside(root)` : ''}
      Add only locators from this HTML: \n\n${html}`,
  },
]
