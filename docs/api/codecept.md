# Codecept

CodeceptJS runner

**Parameters**

-   `config`  
-   `opts`  

## bootstrap

Executes hooks and bootstrap.
If bootstrap is async, second parameter is required.

**Parameters**

-   `done` **Any** 

## constructor

Create CodeceptJS runner.
Config and options should be passed

**Parameters**

-   `config` **Any** 
-   `opts` **Any** 

## init

Initialize CodeceptJS at specific directory.
If async initialization is required, pass callback as second parameter.

**Parameters**

-   `dir` **Any** 
-   `callback` **Any** 

## initGlobals

Creates global variables

**Parameters**

-   `dir` **Any** 

## loadTests

Loads tests by pattern or by config.tests

**Parameters**

-   `pattern` **[string]** 

## run

Run a specific test or all loaded tests.

**Parameters**

-   `test` **[string]** 

## teardown

Executes teardown.
If teardown is async a parameter is provided.

**Parameters**

-   `done` **Any** 
