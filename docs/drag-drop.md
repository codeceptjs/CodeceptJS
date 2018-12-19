# Drag and Drop

There is no browser support for drag-and-drop, so every page builds its own version. 

Most of the Codecept helpers do support a `dragAndDrop` command, but whether it will work for your implementation of dragging varies.

### dragAndDrop

Drag an item to a destination element.

```js
I.dragAndDrop('#dragHandle', '#container');
```

#### Parameters

-   `srcElement`  located by CSS|XPath|strict locator.
-   `destElement`  located by CSS|XPath|strict locator.

## JQueryUI Drag+Drop Example

Using http://jqueryui.com/resources/demos/droppable/default.html

```js
// Drag item from source to target (no iframe) @dragNdrop', 
I.amOnPage('http://jqueryui.com/resources/demos/droppable/default.html')
I.seeElementInDOM('#draggable')
I.dragAndDrop('#draggable', '#droppable')
I.see('Dropped');
```

## JQuery Drag+Drop within iframe

Using http://jqueryui.com/droppable

```js
// Drag and drop from within an iframe
I.amOnPage('http://jqueryui.com/droppable')
I.resizeWindow(700, 700)
I.switchTo('//iframe[@class="demo-frame"]')
I.seeElementInDOM('#draggable')
I.dragAndDrop('#draggable', '#droppable')
I.see('Dropped');
```
