# FileSystem

<<<<<<< HEAD
[lib/helper/FileSystem.js:22-87](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L22-L87 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:22-87](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L22-L87 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Helper for testing filesystem.
Can be easily used to check file structures:

```js
I.amInPath('test');
I.seeFile('codecept.json');
I.seeInThisFile('FileSystem');
I.dontSeeInThisFile("WebDriverIO");
```

## amInPath

<<<<<<< HEAD
[lib/helper/FileSystem.js:34-37](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L34-L37 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:34-37](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L34-L37 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Enters a directory In local filesystem.
Starts from a current directory

**Parameters**

-   `openPath`  

## dontSeeFileContentsEqual

<<<<<<< HEAD
[lib/helper/FileSystem.js:82-85](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L82-L85 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:82-85](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L82-L85 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that contents of file found by `seeFile` doesn't equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## dontSeeInThisFile

<<<<<<< HEAD
[lib/helper/FileSystem.js:66-69](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L66-L69 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:66-69](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L66-L69 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that file found by `seeFile` doesn't include text.

**Parameters**

-   `text`  
-   `encoding`  

## seeFile

<<<<<<< HEAD
[lib/helper/FileSystem.js:49-53](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L49-L53 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:49-53](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L49-L53 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that file exists

**Parameters**

-   `name`  

## seeFileContentsEqual

<<<<<<< HEAD
[lib/helper/FileSystem.js:74-77](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L74-L77 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:74-77](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L74-L77 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that contents of file found by `seeFile` equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## seeInThisFile

<<<<<<< HEAD
[lib/helper/FileSystem.js:58-61](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L58-L61 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:58-61](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L58-L61 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that file found by `seeFile` includes a text.

**Parameters**

-   `text`  
-   `encoding`  

## writeToFile

<<<<<<< HEAD
[lib/helper/FileSystem.js:42-44](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/FileSystem.js#L42-L44 "Source code on GitHub")
=======
[lib/helper/FileSystem.js:42-44](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/FileSystem.js#L42-L44 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Writes test to file

**Parameters**

-   `name`  
-   `text`  
