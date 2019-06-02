---
id: react
title: Testing React Applications
---

React applications require some additional love for end to end testing.
At first, it is very hard to test an application which was never designed to be tested!
This happens to many React application. While building components developers often forget to keep the element's semantic.

Generated HTML code may often look like this:

```js
<div class="jss607 jss869 jss618 jss871 jss874 jss876" tabindex="0" role="tab" aria-selected="true" style="pointer-events: auto;">
  <span class="jss877">
    <span class="jss878">
      <span class="jss879">Click Me!</span>
    </span>
  </span>
<span class="jss610"></span></div>
```

It's quite common that clickable elements are not actual `a` or `button` elements. This way `I.click('Link');` won't work, as well as `fillField('name', 'value)`. Finding a correct locator for such cases may be almost impossible.

In this case test engineers have two options:

* Update JSX files to set element's semantic and rebuild the application
* Test the application how it is now.

We recommend for long-running projects to go with the first option. The better you write your initial HTML the cleaner and less fragile will be your tests. Replace divs with correct HTML elements, add `data-` attributes, add labels, and names to input fields to make all CodeceptJS magic like clicking link by a text to work.

However, if you can't update the code you can go to the second option. In this case, you should bind your locators to visible text on page and available semantic attribues. For instance, instead of using generated locator as this one:

```
//*[@id="document"]/div[2]/div/div[2]/div
```

use [Locator Builder](https://codecept.io/locators#locator-builder) to build clean semantic locator:

```js
locate('[role=tab]').withText('Click Me!');
```

This way you can build very flexible and stable locators even on application never designed for testing.

## Locators

For React apps a special `react` locator is available. It allows to select an element by its component name, props and state.

```js
{ react: 'MyComponent' }
{ react: 'Button', props: { title: 'Click Me' }}
{ react: 'Button', state: { some: 'state' }}
{ react: 'Input', state: 'valid'}
```

In WebDriver and Puppeteer you can use this locators in any method which requires a locator:

```js
I.click({ react: 'Tab', props: { title: 'Click Me!' }});
```

To find React element names and props in a tree use [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) extension.

> Turn off minifcation for application builds otherwise component names will be uglified as well

