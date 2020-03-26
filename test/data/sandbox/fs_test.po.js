Feature('Filesystem');

Scenario('check current dir', ({ I, MyPage }) => {
  I.openDir('aaa');
  I.seeFile('codecept.json');
  MyPage.hasFile('uu');
  I.seeFile('codecept.po.json');
});
