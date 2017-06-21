# Loki

Helper with in memory databse for data driven testing and result capturing.

**Parameters**

-   `config`  

## addCollection

Will check for an existing collection of the same name and return that, if it already exists.

**Parameters**

-   `collection` **string** creates a collection with supplied name.

## clear

Clears data from a matching collection.

**Parameters**

-   `collection` **string** name of desired collection.

## find

Searches the Users colection for matching values.

**Parameters**

-   `collection` **string** name of desired collection.
-   `query` **Object** used in searching the destination collection for matching values.

**Examples**

```javascript
// Searches for a user with an email of "someone@email.com"
I.find("Users",{email: "someone@email.com"})
```

Returns **Array&lt;Object&gt;** Returns an array of objects that match.

## findAndRemove

Like `findAndUpdate()` but finds a record in a collection and removes it.

**Parameters**

-   `collection` **string** name of desired collection.
-   `query` **Object** used in searching the destination collection for matching values.

## findAndUpdate

Finds a list of values based on the supplied query and runs an update function on each result.

**Parameters**

-   `collection` **string** name of desired collection.
-   `query` **Object** used in searching the destination collection for matching values.
-   `updateFunction` **function** executes against each of the results in the result array.

**Examples**

```javascript
// Before {email: "someone@email.com", firstname: "Some", surname: "One", address1: "1 Some Place"}
I.findAndUpdate("users",{email: "someone@email.com"},(res)=>{res.number = "01234567890"})
// Find updated record
I.findOne("Users",{email: "someone@email.com"})
// After {email: "someone@email.com", firstname: "Some", surname: "One", address1: "1 Some Place", number:01234567890}
```

## findCollection

**Parameters**

-   `collection` **string** name of desired collection.

## findOne

Effectively the same as `find()` but returns a single object rather than an array.

**Parameters**

-   `collection` **string** name of desired collection.
-   `query` **Object** used in searching the destination collection for matching values.

## importData

Imports data from a directory into a collection. Uses file names to create a collection of the same name and imports the contents of the file as records to the destination.

**Parameters**

-   `dir` **string** takes a directory as a string.

## insert

Inserts records from the supplied data to a matching collection.

**Parameters**

-   `collection` **string** name of desired collection.
-   `data` **Array&lt;Object&gt;** takes an array of objects as records for the destination collection.

## removeCollection

Removes a matching collection.

**Parameters**

-   `collection` **string** finds a collection that matches the supplied name
