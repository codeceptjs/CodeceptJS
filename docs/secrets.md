# Secrets

It is possible to **mask out sensitive data** when passing it to steps. This is important when filling password fields, or sending secure keys to API endpoint. 

Wrap data in `secret` function to mask sensitive values in output and logs.

For basic string `secret` just wrap a value into a string:

```js
I.fillField('password', secret('123456'));
```

When executed it will be printed like this:

```
I fill field "password" "*****"
```

For an object, which can be a payload to POST request, specify which fields should be masked:

```js
I.sendPostRequest('/login', secret({
  name: 'davert',
  password: '123456'
}, 'password'))
```

The object created from `secret` is as Proxy to the object passed in. When printed password will be replaced with ****. 

> ⚠️ Only direct properties of the object can be masked via `secret`