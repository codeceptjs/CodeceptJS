import fs from 'fs';
import path from 'path';

Feature('Filesystem');

Scenario('failed test', ({ I, MyPage }) => {
  I.openDir('aaa');
  I.seeFile('codecept.class.js');
  MyPage.failedMethod('First arg', 'Second arg');
  I.seeFile('codecept.po.js');
});
