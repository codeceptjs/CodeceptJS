const { I, MyPage } = inject();

Feature('Filesystem');

Scenario('check current dir', () => {
  console.log('injected', I, MyPage);
  I.openDir('aaa');
  I.seeFile('codecept.json');
  MyPage.hasFile('uu');
  I.seeFile('codecept.po.json');
});
