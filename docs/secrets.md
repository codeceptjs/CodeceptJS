# Secrets

It is possible to **mask out sensitive data** when passing it to steps. This is important when filling password fields, or sending secure keys to API endpoint. CodeceptJS provides two approaches for masking sensitive data:

## 1. Using the `secret()` Function

Wrap data in `secret` function to mask sensitive values in output and logs.

For basic string `secret` just wrap a value into a string:

```js
I.fillField('password', secret('123456'))
```

When executed it will be printed like this:

```
I fill field "password" "*****"
```

**Other Examples**

```js
I.fillField('password', secret('123456'))
I.append('password', secret('123456'))
I.type('password', secret('123456'))
```

For an object, which can be a payload to POST request, specify which fields should be masked:

```js
I.sendPostRequest(
  '/login',
  secret(
    {
      name: 'davert',
      password: '123456',
    },
    'password',
  ),
)
```

The object created from `secret` is as Proxy to the object passed in. When printed password will be replaced with \*\*\*\*.

> ⚠️ Only direct properties of the object can be masked via `secret`

## 2. Global Sensitive Data Masking

CodeceptJS can automatically mask sensitive data in all output (logs, steps, debug messages, errors) using configurable patterns. This feature uses the `maskSensitiveData` configuration option.

### Basic Usage (Boolean)

Enable basic masking with predefined patterns:

```js
// codecept.conf.js
exports.config = {
  // ... other config
  maskSensitiveData: true,
}
```

This will mask common sensitive data patterns like:

- Authorization headers
- API keys
- Passwords
- Tokens
- Client secrets

### Advanced Usage (Custom Patterns)

Define your own masking patterns:

```js
// codecept.conf.js
exports.config = {
  // ... other config
  maskSensitiveData: {
    enabled: true,
    patterns: [
      {
        name: 'Email',
        regex: /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/gi,
        mask: '[MASKED_EMAIL]',
      },
      {
        name: 'Credit Card',
        regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
        mask: '[MASKED_CARD]',
      },
      {
        name: 'Phone Number',
        regex: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
        mask: '[MASKED_PHONE]',
      },
      {
        name: 'SSN',
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        mask: '[MASKED_SSN]',
      },
    ],
  },
}
```

### Pattern Configuration

Each custom pattern object should have:

- `name`: A descriptive name for the pattern
- `regex`: A JavaScript regular expression to match the sensitive data
- `mask`: The replacement string to show instead of the sensitive data

### Examples

With the above configuration:

**Input:**

```
User email: john.doe@company.com
Credit card: 4111 1111 1111 1111
Phone: +1-555-123-4567
```

**Output:**

```
User email: [MASKED_EMAIL]
Credit card: [MASKED_CARD]
Phone: [MASKED_PHONE]
```

### Where Masking Applies

Global sensitive data masking is applied to:

- Step descriptions and output
- Debug messages (`--debug` mode)
- Log messages (`--verbose` mode)
- Error messages
- Success messages

> ⚠️ Direct `console.log()` calls in helper functions are not masked. Use CodeceptJS output functions instead.

### Combining Both Approaches

You can use both `secret()` function and global masking together. The `secret()` function is applied first, then global patterns are applied to the remaining output.
