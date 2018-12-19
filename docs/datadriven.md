
# Data Driven Tests

Execute the same scenario on a different data set.

Let's say you want to test login for different user accounts.
In this case, you need to create a datatable and fill it in with credentials.
Then use `Data().Scenario` to include this data and generate multiple scenarios:

```js
// Define data table inside a test or load from another module
let accounts = new DataTable(['login', 'password']); //
accounts.add(['davert', '123456']); // adding records to a table
accounts.add(['admin', '123456']);

// You can skip some data. But add them to report as skipped (just like with usual scenarios):
accounts.xadd(['admin', '23456'])

// Pass dataTable to Data()
// Use special param `current` to get current data set
Data(accounts).Scenario('Test Login', (I, current) => {
  I.fillField('Username', current.login); // current is reserved!
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});


// Also you can set only for Data tests. It will launch executes only the current test but with all data options
Data(accounts).only.Scenario('Test Login', (I, current) => {
  I.fillField('Username', current.login); // current is reserved!
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});
```

*Important: you can't use name `current` for pageObjects or helpers in data scenarios*

This will produce 2 tests with different data sets.
Current data set is appended to a test name in output:

```sh
✓ Test Login | {"login":"davert","password":"123456"}
✓ Test Login | {"login":"admin","password":"123456"}
S Test Login | {"login":"admin","password":"23456"}
```

```js
// You can filter your data table
Data(accounts.filter(account => account.login == 'admin')
.Scenario('Test Login', (I, current) => {
  I.fillField('Username', current.login);
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});
```

This will limit data sets accoring passed function:

```sh
✓ Test Login | {"login":"admin","password":"123456"}
S Test Login | {"login":"admin","password":"23456"}
```

Data sets can also be defined with array, generator, or a function.

```js
Data(function*() {
  yield { user: 'davert'};
  yield { user: 'andrey'};
}).Scenario() // ...
```

*HINT: If you don't use DataTable. add `toString()` method to each object added to data set, so the data could be pretty printed in a test name*
