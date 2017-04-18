# Config

Current configuration

**Parameters**

-   `newConfig`  

## append

Appends values to current config

**Parameters**

-   `additionalConfig` **Any** 

## create

Create a config with default options

**Parameters**

-   `newConfig` **Any** 

## get

Get current config.

## load

Load config from a file.
If js file provided: require it and get .config key
If json file provided: load and parse JSON
If directory provided:

-   try to load `codecept.conf.js` from it
-   try to load `codecept.json` from it
    If none of above: fail.

**Parameters**

-   `configFile` **Any** 

## reset

Resets config to default
