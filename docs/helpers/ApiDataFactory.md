# ApiDataFactory

Helper for managing remote data using REST API.
Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.

By defining a factory you set the rules of how data is generated.
This data will be saved on server via REST API and deleted in the end of a test.

## Use Case

Acceptance tests interact with a websites using UI and real browser.
There is no way to create data for a specific test other than from user interface.
That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.

This helper solves this problem.
Most of web application have API, and it can be used to create and delete test records.
By combining REST API with Factories you can easily create records for tests:

```js
I.have('user', { login: 'davert', email: 'davert@mail.com' });
let id = await I.have('post', { title: 'My first post'});
I.haveMultiple('comment', 3, {post_id: id});
```

To make this work you need

1.  REST API endpoint which allows to perform create / delete requests and
2.  define data generation rules

### Setup

Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.

```sh
npm i rosie faker --save-dev`
```

Create a factory file for a resource.

See the example for Posts factories:

```js
// tests/factories/posts.js

var Factory = require('rosie').Factory;
var faker = require('faker');

module.exports = new Factory()
   // no need to set id, it will be set by REST API
   .attr('author', () => faker.name.findName())
   .attr('title', () => faker.lorem.sentence())
   .attr('body', () => faker.lorem.paragraph());
```

For more options see [rosie documentation](https://github.com/rosiejs/rosie).

Then configure ApiDataHelper to match factories and REST API:

### Configuration

ApiDataFactory has following config options:

-   `endpoint`: base URL for the API to send requests to.
-   `cleanup`: should inserted records be deleted up after tests. Default: true
-   `factories`: list of defined factories
-   `REST`: configuration for REST requests

See the example:

```js
 "ApiDataFactory": {
   "endpoint": "http://user.com/api",
   "cleanup": true,
   "factories": {
     "post": {
        "uri": "/posts"
        "factory": "./factories/post"
     },
     "comment": {
       "factory": "./factories/comment",
       "create": { "post": "/comments/create" },
       "delete": { "post": "/comments/delete" }
     }
   }
}
```

It is required to set REST API `endpoint` which is the baseUrl for all API requests.
Factory file is expected to be passed via `factory` option.

This Helper uses [REST](http://codecept.io/helpers/REST/) helper and accepts its configuration in "REST" section.
So, in order to set default headers or timeout you should add:

```js
"ApiDataFactory": {
   "REST": {
     "timeout": "100000",
     "defaultHeaders": {
       "auth": "111111"
     }
  }
}
```

### Api Requests

By default to create a record ApiDataFactory will use endpoint and plural factory name:

-   create: `POST {endpoint}/{resource} data`
-   delete: `DELETE {endpoint}/{resource}/id`

Example (`endpoint`: `http://app.com/api`):

-   create: POST request to `http://app.com/api/users`
-   delete: DELETE request to `http://app.com/api/users/1`

However this behavior can be configured with following options:

-   `uri`: set different resource uri. Example: `uri: account` => `http://app.com/api/account`.
-   `create`: override create options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/create" }`
-   `delete`: override delete options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/delete/{id}" }`

**Parameters**

-   `config`  

## _fetchId

Fetches id of a record after it was created by `have`.
By default fetched `id` attribute from JSON body.

Customize it from custom Helper file:

```js
this.helpers['ApiDataFactory']._fetchId = (body, factory) {
   return body[factory][0].id;
}
```

**Parameters**

-   `body` **Any** 
-   `factory` **Any** 

## _requestCreate

Executes request to create a record in API.
Can be replaced from a in custom helper.

**Parameters**

-   `factory` **Any** 
-   `data` **Any** 

## _requestDelete

Executes request to delete a record in API
Can be replaced from a custom helper.

**Parameters**

-   `factory` **Any** 
-   `id` **Any** 

## have

Generates a new record using factory and saves API request to store it.

```js
// create a user
I.have('user');
// create user with defined email
I.have('user', { email: 'user@user.com'});
```

**Parameters**

-   `factory` **Any** factory to use
-   `params` **Any** predefined parameters

## haveMultiple

Generates bunch of records and saves multiple API requests to store them.

```js
// create 3 posts
I.have('post', 3);

// create 3 posts by one author
I.have('post', 3, { author: 'davert' });
```

**Parameters**

-   `factory` **Any** 
-   `times` **Any** 
-   `params` **Any** 
