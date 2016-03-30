# FileSystem

Helper for testing filesystem.
Can be easily used to check file structures:

```js
I.amInPath('test');
I.seeFile('codecept.json');
I.seeInThisFile('FileSystem');
I.dontSeeInThisFile("WebDriverIO");
```

## amInPath

Enters a directory In local filesystem.
Starts from a current directory

**Parameters**

-   `openPath`  

## dontSeeFileContentsEqual

Checks that contents of file found by `seeFile` doesn't equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## dontSeeInThisFile

Checks that file found by `seeFile` doesn't include text.

**Parameters**

-   `text`  
-   `encoding`  

## seeFile

Checks that file exists

**Parameters**

-   `name`  

## seeFileContentsEqual

Checks that contents of file found by `seeFile` equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## seeInThisFile

Checks that file found by `seeFile` includes a text.

**Parameters**

-   `text`  
-   `encoding`  

## writeToFile

Writes test to file

**Parameters**

-   `name`  
-   `text`  
