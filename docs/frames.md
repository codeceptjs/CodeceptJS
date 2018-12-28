# Within frames and iframes

Codecept supports working within multiple frames on a page using the `within` function.

Note that waits for the iframe page follow the same model as page-to-page navigation, and if your frame takes too long to load, it may break your test.

## IFrames

The [within](locators.md#within) operator can be used to work inside IFrames. Special `frame` locator is required to locate the iframe and get into its context.

For example:

```js
within({frame: "#editor"}, () => {
  I.see('Page');
});
```

Nested IFrames can be set by passing array *(WebDriver, Nightmare & Puppeteer only)*:

```js
within({frame: [".content", "#editor"]}, () => {
  I.see('Page');
});
```

Please take a note that you can't use within inside another within in Puppeteer helper:

```js
within('.todoapp', () => {
  I.createTodo('my new item');
  I.see('1 item left', '.todo-count');
  I.click('.todo-list input.toggle');
});
I.see('0 items left', '.todo-count');
```
