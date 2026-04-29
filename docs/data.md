---
permalink: /data
title: Data Management
---

# Data Management

> This chapter describes data management for external sources. If you are looking for using Data Sets in tests, see [Data Driven Tests](https://codecept.io/advanced/#data-drivern-tests) section\*

Managing data for tests is always a tricky issue. How isolate data between tests, how to prepare data for different tests, etc.
There are different approaches to solve it:

1.  reset database completely between tests
2.  create unique non-intersecting data sets per each test
3.  create and delete data for a test

The most efficient way would be to allow test to control its data, i.e. the 3rd option.
However, accessing database directly is not a good idea as database vendor, schema and data are used by application internally and are out of scope of acceptance test.

Today all modern web applications have REST or GraphQL API . So it is a good idea to use it to create data for a test and delete it after.
API is supposed to be a stable interface and it can be used by acceptance tests. CodeceptJS provides helpers for Data Management via REST and GraphQL API, as well as **[Data Objects](/pageobjects#data-objects)** — class-based page objects with automatic cleanup via lifecycle hooks.

## Data Objects

Data Objects are page object classes designed to manage test data via API. They use the REST helper (through `I`) to create data in a test and clean it up automatically via the `_after()` hook.

This is a lightweight alternative to [ApiDataFactory](#api-data-factory) — ideal when you want full control over data creation and cleanup logic without factory configuration.

### Defining a Data Object

```js
const { I } = inject();

class UserData {
  constructor() {
    this._created = [];
  }

  async createUser(data = {}) {
    const response = await I.sendPostRequest('/api/users', {
      name: data.name || 'Test User',
      email: data.email || `test-${Date.now()}@example.com`,
      ...data,
    });
    this._created.push(response.data.id);
    return response.data;
  }

  async createPost(userId, data = {}) {
    const response = await I.sendPostRequest('/api/posts', {
      userId,
      title: data.title || 'Test Post',
      body: data.body || 'Test body',
      ...data,
    });
    this._created.push({ type: 'post', id: response.data.id });
    return response.data;
  }

  async _after() {
    for (const record of this._created.reverse()) {
      const id = typeof record === 'object' ? record.id : record;
      const type = typeof record === 'object' ? record.type : 'user';
      try {
        await I.sendDeleteRequest(`/api/${type}s/${id}`);
      } catch (e) {
        // cleanup errors should not fail the test
      }
    }
    this._created = [];
  }
}

export default UserData
```

### Configuration

Add the REST helper and the Data Object to your config:

```js
helpers: {
  Playwright: { url: 'http://localhost', browser: 'chromium' },
  REST: {
    endpoint: 'http://localhost/api',
    defaultHeaders: { 'Content-Type': 'application/json' },
  },
},
include: {
  I: './steps_file.js',
  userData: './data/UserData.js',
}
```

### Usage in Tests

```js
Scenario('user sees their profile', async ({ I, userData }) => {
  const user = await userData.createUser({ name: 'John Doe' });
  I.amOnPage(`/users/${user.id}`);
  I.see('John Doe');
  // userData._after() runs automatically — deletes the created user
});
```

Data Objects can use any helper methods available via `I`, including `sendGetRequest`, `sendPutRequest`, and browser actions. They combine the convenience of managed test data with the flexibility of page objects.

**Learn more:** See [Page Objects](/pageobjects) for general page object patterns.

## REST

[REST helper](https://codecept.io/helpers/REST/) allows sending raw HTTP requests to application.
This is a tool to make shortcuts and create your data pragmatically via API. However, it doesn't provide tools for testing APIs, so it should be paired with Playwright or WebDriver helper for browser testing.

Enable REST helper in the config. It is recommended to set `endpoint`, a base URL for all API requests. If you need some authorization you can optionally set default headers too.

See the sample config:

```js
helpers: {
  REST: {
    endpoint: "http://localhost/api/v1/",
    defaultHeaders: {
      'Auth': '11111',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  WebDriver : {
    url: 'http://localhost',
    browser: 'chrome'
  }
}
```

REST helper provides basic methods to send requests to application:

```js
I.sendGetRequest()
I.sendPostRequest()
I.sendPutRequest()
I.sendPatchRequest()
I.sendDeleteRequest()
I.sendDeleteRequestWithPayload()
```

As well as a method for setting headers: `haveRequestHeaders`.

Here is a usage example:

```js
let postId = null

Scenario('check post page', async ({ I }) => {
  // valid access token
  I.haveRequestHeaders({ auth: '1111111' })
  // get the first user
  let user = await I.sendGetRequest('/api/users/1')
  // create a post and save its Id
  postId = await I.sendPostRequest('/api/posts', { author: user.id, body: 'some text' })
  // open browser page of new post
  I.amOnPage('/posts/2.html')
  I.see('some text', 'p.body')
})

// cleanup created data
After(({ I }) => {
  I.sendDeleteRequest('/api/posts/' + postId)
})
```

This can also be used to emulate Ajax requests:

```js
I.sendPostRequest('/update-status', {}, { http_x_requested_with: 'xmlhttprequest' })
```

> See complete reference on [REST](https://codecept.io/helpers/REST) helper

## GraphQL

[GraphQL helper](https://codecept.io/helpers/GraphQL/) allows sending GraphQL queries and mutations to application, over Http.

This tool allows you to create shortcuts and manage your data pragmatically via a GraphQL endpoint. However, it does not include tools for testing the endpoint, so it should be used in conjunction with WebDriver helpers for browser testing.

Enable GraphQL helper in the config. It is recommended to set `endpoint`, the URL to which the requests go to. If you need some authorization you can optionally set default headers too.

See the sample config:

```js
helpers: {
  GraphQL: {
    endpoint: "http://localhost/graphql/",
    defaultHeaders: {
      'Auth': '11111',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  WebDriver : {
    url: 'http://localhost',
    browser: 'chrome'
  }
}
```

GraphQL helper provides two basic methods to queries and mutations to application:

```js
I.sendQuery()
I.sendMutation()
```

As well as a method for setting headers: `haveRequestHeaders`.

Here is a usage example:

```js
let postData = null

Scenario('check post page', async ({ I }) => {
  // valid access token
  I.haveRequestHeaders({ auth: '1111111' })
  // get the first user
  let response = await I.sendQuery('{ user(id:1) { id }}')
  let user = response.data
  // create a post and save its Id
  response = await I.sendMutation('mutation createPost($input: PostInput!) { createPost(input: $input) { id }}', {
    input: {
      author: user.data.id,
      body: 'some text',
    },
  })
  postData = response.data.data['createPost']
  // open browser page of new post
  I.amOnPage(`/posts/${postData.slug}.html`)
  I.see(postData.body, 'p.body')
})

// cleanup created data
After(({ I }) => {
  I.sendMutation('mutation deletePost($id: ID!) { deletePost(id: $id) }', { id: postData.id })
})
```

> See complete reference on [GraphQL](https://codecept.io/helpers/GraphQL) helper

## Data Generation with Factories

This concept is extended by:

- [ApiDataFactory](https://codecept.io/helpers/ApiDataFactory/) helper, and,
- [GraphQLDataFactory](https://codecept.io/helpers/GraphQLDataFactory/) helper.

These helpers build data according to defined rules and use REST API or GraphQL mutations to store them and automatically clean them up after a test.

Just define how many items of any kind you need and the data factory helper will create them for you.

To make this work some preparations are required.

At first, you need data generation libraries which are [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://fakerjs.dev). Faker can generate random names, emails, texts, and Rosie uses them
to generate objects using factories.

Install rosie and faker to create a first factory:

```sh
npm i rosie @faker-js/faker --save-dev
```

Then create a module which will export a factory for an entity.
And add that module as a part of the configuration for the helper.

Please look at the respective Factory sections for examples for factory modules and configuration.

### API Data Factory

This helper uses REST API to store the built data and automatically clean them up after a test,
The way for setting data for a test is as simple as writing:

```js
// inside async function
let post = await I.have('post')
I.haveMultiple('comment', 5, { postId: post.id })
```

After completing the preparations under 'Data Generation with Factories', create a factory module which will export a factory.

See the example providing a factory for User generation:

```js
// factories/post.js
import { Factory } from 'rosie'
import { faker } from '@faker-js/faker'

export default new Factory().attr('name', () => faker.person.findName()).attr('email', () => faker.internet.email())
```

Next is to configure helper to match factories with API:

```js
 ApiDataFactory: {
   endpoint: "http://user.com/api",
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json',
   },
   factories: {
     user: {
        uri: "/users",
        factory: "./factories/user"
     }
   }
 }
```

Then, calling `I.have('user')` inside a test will create a new user for you.
This is done by sending POST request to `/api/users` URL. Response is returned and can be used in tests.

At the end of a test ApiDataFactory will clean up created record for you. This is done by collecting
ids from crated records and running `DELETE /api/users/{id}` requests at the end of a test.
This rules can be customized in helper configuration.

> See complete reference on [ApiDataFactory](https://codecept.io/helpers/ApiDataFactory) helper

### GraphQL Data Factory

The helper uses GraphQL mutations to store the built data and automatically clean them up after a test.
This way for setting data for a test is as simple as writing:

```js
// inside async function
let post = await I.mutateData('createPost')
I.mutateMultiple('createComment', 5, { postId: post.id })
```

After completing the preparations under 'Data Generation with Factories', create a factory module which will export a factory.

The object built by the factory is sent as the variables object along with the mutation. So make sure it matches the argument type as detailed in the GraphQL schema. You may want to pass a constructor to the factory to achieve that.

See the example providing a factory for User generation:

```js
// factories/post.js
import { Factory } from 'rosie'
import { faker } from '@faker-js/faker'

export default new Factory((buildObj) => {
  return {
    input: { ...buildObj },
  }
})
  .attr('name', () => faker.person.findName())
  .attr('email', () => faker.internet.email())
```

Next is to configure helper to match factories with API:

```js
GraphQLDataFactory: {
  endpoint: "http://user.com/graphql",
  cleanup: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  factories: {
    createUser: {
      query: 'mutation createUser($input: UserInput!) { createUser(input: $input) { id name }}',
      factory: './factories/users',
      revert: (data) => ({
        query: 'mutation deleteUser($id: ID!) { deleteUser(id: $id) }',
        variables: { id : data.id},
      }),
    },
  }
```

Then, calling `I.mutateData('createUser')` inside a test will create a new user for you.
This is done by sending a GraphQL mutation request over Http to `/graphql` endpoint. Response is returned and can be used in tests.

At the end of a test GraphQLDataFactory will clean up created record for you. This is done by collecting
data from crated records, creating deletion mutation objects by passing the data to the `revert` function provided, and sending deletion mutation objects as requests at the end of a test.
This behavior is according the `revert` function be customized in helper configuration.
The revert function returns an object, that contains the query for deletion, and the variables object to go along with it.

> See complete reference on [GraphQLDataFactory](https://codecept.io/helpers/GraphQLDataFactory) helper

## Requests Using Browser Session

All the REST, GraphQL, GraphQLDataFactory, and ApiDataFactory helpers allow override requests before sending.
This feature can be used to fetch current browser cookies and set them to REST API or GraphQL client.
By doing this we can make requests within the current browser session without a need of additional authentication.

> Sharing browser session with ApiDataFactory or GraphQLDataFactory can be especially useful when you test Single Page Applications

CodeceptJS bundles [`@codeceptjs/configure`](https://github.com/codeceptjs/configure), which exposes `setSharedCookies` for this case. Call it before exporting your config:

```js
// in codecept.conf.js
import { setSharedCookies } from '@codeceptjs/configure'

// share cookies between browser helpers and REST/GraphQL
setSharedCookies()

export const config = {}
```

Without `setSharedCookies` you will need to update the config manually, so a data helper could receive cookies from a browser to make a request. If you would like to configure this process manually, here is an example of doing so:

```js

let cookies; // share cookies

export const config = {
helpers: {
  ApiDataFactory: {
    endpoint: 'http://local.app/api',
    cleanup: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    factories: {
      user: {
          uri: "/users",
          factory: "./factories/user",
      }
    },
    onRequest: async (request) => {
      // get a cookie if it's not obtained yet
      if (cookies) cookies = await codeceptjs.container.helpers('WebDriver').grabCookie();
      // add cookies to request for a current request
      request.headers = { Cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') };
    },
  }
  WebDriver: {
    url: 'https://local.app/',
    browser: 'chrome',
  }
}
```

In this case we are accessing WebDriver helper. However, you can replace WebDriver with any helper you use.

The same can be done with GraphQLDataFactory.

The order of helpers is important! ApiDataFactory will clean up created users after a test,
so it needs browser to be still opened to obtain its cookies.
