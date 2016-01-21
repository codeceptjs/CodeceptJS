'use strict';
Feature('Testing Begins');

Scenario('ANI testing', function*(I){
  I.amOnPage('http://www.absolutenet.com/');
  let title = yield I.grabTitle();
  // console.info(title);
  I.see('bogus text that is not there'); //this should give an error and not success.
});