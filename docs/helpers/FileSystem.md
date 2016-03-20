# FileSystem

[lib/helper/FileSystem.js:22-87](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L22-L87 "Source code on GitHub")

**Extends Helper**

Helper for testing filesystem.
Can be easily used to check file structures:

```js
I.amInPath('test');
I.seeFile('codecept.json');
I.seeInThisFile('FileSystem');
I.dontSeeInThisFile("WebDriverIO");
```

## amInPath

[lib/helper/FileSystem.js:34-37](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L34-L37 "Source code on GitHub")

Enters a directory In local filesystem.
Starts from a current directory

**Parameters**

-   `openPath`  

## dontSeeFileContentsEqual

[lib/helper/FileSystem.js:82-85](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L82-L85 "Source code on GitHub")

Checks that contents of file found by `seeFile` doesn't equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## dontSeeInThisFile

[lib/helper/FileSystem.js:66-69](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L66-L69 "Source code on GitHub")

Checks that file found by `seeFile` doesn't include text.

**Parameters**

-   `text`  
-   `encoding`  

## seeFile

[lib/helper/FileSystem.js:49-53](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L49-L53 "Source code on GitHub")

Checks that file exists

**Parameters**

-   `name`  

## seeFileContentsEqual

[lib/helper/FileSystem.js:74-77](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L74-L77 "Source code on GitHub")

Checks that contents of file found by `seeFile` equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## seeInThisFile

[lib/helper/FileSystem.js:58-61](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L58-L61 "Source code on GitHub")

Checks that file found by `seeFile` includes a text.

**Parameters**

-   `text`  
-   `encoding`  

## writeToFile

[lib/helper/FileSystem.js:42-44](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/FileSystem.js#L42-L44 "Source code on GitHub")

Writes test to file

**Parameters**

-   `name`  
-   `text`  
