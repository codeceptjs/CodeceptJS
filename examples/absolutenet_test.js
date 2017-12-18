Feature('Testing Begins');

// test with some demo params
Scenario('ANI testing', { id: 123, user_id: 1235 }, function* (I) {
  I.amOnPage('http://www.absolutenet.com/');
  const title = yield I.grabTitle();
  // console.info(title);
  I.see('bogus text that is not there'); // this should give an error and not success.
});
