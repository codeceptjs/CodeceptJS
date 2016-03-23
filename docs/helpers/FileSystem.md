# FileSystem

[docs/build/FileSystem.js:22-87](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L22-L87 "Source code on GitHub")

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

[docs/build/FileSystem.js:34-37](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L34-L37 "Source code on GitHub")

Enters a directory In local filesystem.
Starts from a current directory

**Parameters**

-   `openPath`  

## dontSeeFileContentsEqual

[docs/build/FileSystem.js:82-85](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L82-L85 "Source code on GitHub")

Checks that contents of file found by `seeFile` doesn't equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## dontSeeInThisFile

[docs/build/FileSystem.js:66-69](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L66-L69 "Source code on GitHub")

Checks that file found by `seeFile` doesn't include text.

**Parameters**

-   `text`  
-   `encoding`  

## seeFile

[docs/build/FileSystem.js:49-53](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L49-L53 "Source code on GitHub")

Checks that file exists

**Parameters**

-   `name`  

## seeFileContentsEqual

[docs/build/FileSystem.js:74-77](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L74-L77 "Source code on GitHub")

Checks that contents of file found by `seeFile` equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## seeInThisFile

[docs/build/FileSystem.js:58-61](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L58-L61 "Source code on GitHub")

Checks that file found by `seeFile` includes a text.

**Parameters**

-   `text`  
-   `encoding`  

## writeToFile

[docs/build/FileSystem.js:42-44](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/FileSystem.js#L42-L44 "Source code on GitHub")

Writes test to file

**Parameters**

-   `name`  
-   `text`  
