Feature('Filesystem');

Scenario('check current dir', ({ I, MyPage }) => {
  I.openDir('aaa');
  I.seeFile('allure.conf.js');
  MyPage.hasFile('First arg', 'Second arg');
  I.seeFile('codecept.po.js');
});
