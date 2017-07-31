# REST

REST helper allows to send additional requests to the REST API during acceptance tests.
[Unirest](http://unirest.io/nodejs.html) library is used to perform requests.

## Configuration

-   endpoint: API base URL
-   timeout: timeout for requests in milliseconds. 10000 by default
-   defaultHeaders: a list of default headers
-   resetHeaders: set to true to reset headers  between requests. Disabled by default

**Parameters**

-   `config`  

## _executeRequest

Executes unirest request

**Parameters**

-   `request` **Any** 

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

## sendDeleteRequest

Sends DELETE request to API.

```js
I.sendDeleteRequest('/api/users/1');
```

**Parameters**

-   `url` **Any** 
-   `payload` **Any** 
-   `headers`   (optional, default `{}`)

## sendGetRequest

Send GET request to REST API

```js
I.sendGetRequest('/api/users.json');
```

**Parameters**

-   `url` **Any** 
-   `object`  headers
-   `headers`   (optional, default `{}`)

## sendPatchRequest

Sends PATCH request to API.

```js
I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
```

**Parameters**

-   `string`  url
-   `object`  payload
-   `object`  headers
-   `url`  
-   `payload`   (optional, default `{}`)
-   `headers`   (optional, default `{}`)

## sendPostRequest

Sends POST request to API.

```js
I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
```

**Parameters**

-   `url` **Any** 
-   `payload` **Any** 
-   `object`  headers
-   `headers`   (optional, default `{}`)

## sendPutRequest

Sends PUT request to API.

```js
I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
```

**Parameters**

-   `string`  url
-   `object`  payload
-   `object`  headers
-   `url`  
-   `payload`   (optional, default `{}`)
-   `headers`   (optional, default `{}`)
