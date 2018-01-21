# REST

REST helper allows to send additional requests to the REST API during acceptance tests.
[Unirest](http://unirest.io/nodejs.html) library is used to perform requests.

## Configuration

-   endpoint: API base URL
-   timeout: timeout for requests in milliseconds. 10000ms by default
-   defaultHeaders: a list of default headers
-   resetHeaders: set to true to reset headers  between requests. Disabled by default
-   followRedirect: set to true to enable automatic redirect. Disabled by default

**Parameters**

-   `config`  

## _cleanRequestHeaders

Changes headers to default if reset headers option is true

## _executeRequest

Executes unirest request

**Parameters**

-   `request` **Any** 

## _url

Generates url based on format sent (takes endpoint + url if latter lacks 'http')

**Parameters**

-   `url` **Any** 

## amFollowingRequestRedirects

Set response auto-redirects ON

```js
I.amFollowingRequestRedirects(); // To enable auto-redirects
```

## amNotFollowingRequestRedirects

Set response auto-redirects OFF

```js
I.amNotFollowingRequestRedirects(); // To disable auto-redirects
```

## haveRequestHeaders

Set headers for the request

```js
I.haveRequestHeaders({
   'Accept': 'application/json',
   'User-Agent': 'Unirest Node.js'
});
```

**Parameters**

-   `customHeaders` **Any** 

## resetRequestHeaders

Reset headers for the request to default state

```js
I.resetRequestHeaders();
```

## sendDeleteRequest

Sends DELETE request to API.

```js
I.sendDeleteRequest('/api/users/1');
```

**Parameters**

-   `url` **Any** 
-   `headers` **object** 

## sendGetRequest

Send GET request to REST API

```js
I.sendGetRequest('/api/users.json');
```

**Parameters**

-   `url` **Any** 
-   `headers` **object** 

## sendPatchRequest

Sends PATCH request to API.

```js
I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
```

**Parameters**

-   `url` **string** 
-   `payload` **object** 
-   `headers` **object** 

## sendPostRequest

Sends POST request to API.

```js
I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
```

**Parameters**

-   `url` **Any** 
-   `payload` **Any** 
-   `headers` **object** 

## sendPutRequest

Sends PUT request to API.

```js
I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
```

**Parameters**

-   `url` **string** 
-   `payload` **object** 
-   `headers` **object** 

## setRequestTimeout

Set timeout for the request

```js
I.setRequestTimeout(10000); // In milliseconds
```

**Parameters**

-   `newTimeout`  
