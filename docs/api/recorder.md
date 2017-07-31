# recorder

Singleton object to record all test steps as promises and run them in chain.

## add

Adds a promise to a chain.
Promise description should be passed as first parameter.

**Parameters**

-   `taskName` **Any** 
-   `fn` **Any** 
-   `force` **Any** 

## errHandler

Add error handler to catch rejected promises

**Parameters**

-   `fn` **Any** 

## promise

Get latest promise in chain.

## reset

Stops current promise chain, calls `catch`.
Resets recorder to initial state.

## scheduled

Get a list of all chained tasks

## start

Start recording promises

## stop

Stops recording promises

## throw

Adds a promise which throws an error into a chain

**Parameters**

-   `err` **Any** 

## toString

Get a state of current queue and tasks
