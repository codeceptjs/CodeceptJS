const fs = require('fs');
const path = require('path');

Feature('Filesystem');

Scenario('failed test', ({ I, MyPage }) => {
  I.openDir('aaa');
  I.seeFile('codecept.class.js');
  MyPage.failedMethod('First arg', 'Second arg');
  I.seeFile('codecept.po.js');
});
