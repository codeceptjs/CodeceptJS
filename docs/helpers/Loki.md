# Loki

Helper with in memory databse for data driven testing and result capturing.
Can be easily used to create dynamic seed data:

```js

```

**Parameters**

-   `config`  

## addCollection

**Parameters**

-   `collection` **string** creates a collection with supplied name.
    Will check for an existing collection and return that,
    if it already exists.

## clear

**Parameters**

-   `collection` **string** clears data from a collection that matches the supplied name.

## find

**Parameters**

-   `collection` **string** finds a collection that matches the supplied name.
-   `query` **Object** takes an Object and searches the destination collection for values that match.

**Examples**

```javascript
// Searches the Users colection for a user with email someone@email.com
I.find("Users",{email: "someone@email.com"})
```

Returns **Array&lt;Object&gt;** Returns an array of objects that match.

## findCollection

**Parameters**

-   `collection` **string** finds a collection that matches the supplied name.

## importData

**Parameters**

-   `dir` **string** takes a directory string and creates an array of filenames within the directory.
    Each file is turned in to a collection of the same name by taking the filename, creating a collection and
    importing the contents of the file as records to the destination collection.

## insert

**Parameters**

-   `collection` **string** finds a collection that matches the supplied name.
-   `data` **Array&lt;Object&gt;** takes an array of Objects and inserts each as a record in to the destination collection.

## removeCollection

**Parameters**

-   `collection` **string** removes a collection that matches the supplied name.
