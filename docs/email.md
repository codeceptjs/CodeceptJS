---
id: email
title: Email Testing
---

In End 2 End testing we need to interact with emails.
Email delivery can't tested locally or mocked while testing.
That's why for an end to end test you need to use a real emails to be sent and real email address to receive that emails.

Setting up an email server can be hard. So we recommend to use a [MailSlurp](https://mailslurp.com/) - a service designed for testing emails. It creates disposable mailboxes and provides you an access to those mailboxes via REST API.

> You no longer need to open your gmail account in a browser to check for an email!

## Installation

MailSlurp is a commercial service with a free plan available. To start, [create an account at MailSlurp](https://app.mailslurp.com/) and receive API key to use it. Once received install mailslurp helper from npm:

```
npm i @codeceptjs/mailslurp-helper --save-dev
```

Then enable a helper in `codecept.conf.js`:

```js
helpers: {

  MailSlurp: {
    require: '@codeceptjs/mailslurp-helper',
    apiKey: '<apiKeyFromMailSlurp>'
  }
}
```

After a helper is added, regenerate TypeScript definitions for auto-completion support:

```
npx codeceptjs def
```

## Creating Mailbox

MailSlurp allows you to create disposable mailboxes. It means that an email address is created for a one test only and is deleted afterwards. So you can be confident that no other emails are received at that address.

To create a mailbox use `I.haveNewMailbox()` command:

```js
// inside async/await function
const mailbox = await I.haveNewMailbox();
```

mailbox object contains:

* `id` - which is used in next commands
* `emailAddress` - randomly generated address of a created mailbox.

> See [Mailslsurp Guide](https://www.mailslurp.com/developers/guides/#create-email-addresses) for details.

Mailbox is opened on creation. If you need more than one mailboxes and you want to switch between them use `openMailbox` method:

```js
const mailbox1 = await I.haveNewMailbox();
const mailbox2 = await I.haveNewMailbox();
// mailbox2 is now default mailbox
// switch back to mailbox1
I.openMailbox(mailbox);
```

## Receiving An Email

A last created mailbox will be activated. It means that it will be used by default to check for emails.

After an action that triggers sending an email is performed on a website you should wait for this email to be received.
A timeout for waiting an email can be set globally for a helper or for a one call.

Use `waitForLatestEmail` function to return the first email from a mailbox:

```js
// to wait for default time (10 secs by default)
I.waitForLatestEmail();

// or specify number of time to wait
I.waitForLatestEmail(30);
```

To specify the exact email to match use `waitForEmailMatching` function:

```js
// wait for an email with partial match in subject
I.waitForEmailMatching({ subject: 'Restore password' });

// wait 30 seconds for email with exact subject
I.waitForEmailMatching({ subject: '=Forgot password' }, 30);

// wait a last email from any address @mysite.com
I.waitForEmailMatching({
 from: '@mysite.com', // find anything from mysite
 subject: 'Restore password', // with Restore password in subject
});
```

## Opening An Email

All wait* functions return a matched email as a result. So you can use it in a test:

```js
const email = await I.waitForLatestEmail();
```
> Please note, that we use `await` to assign email. This should be declared inside async function

An `email` object contains following fields:

* `subject`
* `for`
* `to`
* `body`

So you can analyze them inside a test. For instance, you can extract an URL from email body and open it.
This is how we can emulate "click on this link" behavior in email:

```js
// clicking a link in email
const email = await I.waitForLatestEmail();
// extract a link by RegExp
const url = email.body.match(/http(s):\/\/(.*?)\s/)[0];
// open URL
I.amOnPage(url);
```

## Assertions

Assertions are performed on the currently opened email.Email is opened on `waitFor` email call, however, you can open an exact email by using `openEmail` function.

```js
const email1 = await I.waitForLatestEmail();
// test proceeds...
const email2 = await I.waitForLatestEmail();
I.openEmail(email1); // open previous email
```

After opening an email assertion methods are available.

* `seeInEmailSubject`
* `seeEmailIsFrom`
* `seeInEmailBody`
* `dontSeeInEmailBody`

And here is an example of their usage:

```js
I.waitForLatestEmail()
I.seeEmailIsFrom('@mysite.com');
I.seeInEmailSubject('Awesome Proposal!');
I.seeInEmailBody('To unsubscribe click here');
```

> More methods are listed in [helper's API reference](https://github.com/codecept-js/mailslurp-helper/blob/master/README.md#api)

## Listing All Emails

Use `grabAllEmailsFromMailbox` to get all emails from a current mailbox:

```js
const emails = await I.grabAllEmailsFromMailbox();
```

## Sending an Email

You can also send an email from an active mailbox:

```js
I.sendEmail({
  to: ['user@site.com'],
  subject: 'Hello',
  body: 'World'
});
```
