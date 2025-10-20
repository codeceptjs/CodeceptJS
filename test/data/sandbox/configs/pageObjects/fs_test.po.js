const fs = require('fs');
const path = require('path');

Feature('Filesystem');

Scenario('check current dir', ({ I, MyPage }) => {
  I.openDir('aaa');
  I.seeFile('codecept.class.js');
  MyPage.hasFile('First arg', 'Second arg');
  I.seeFile('codecept.po.js');
});
