const { I, MyPage } = inject();

Feature('Filesystem');

Scenario('check current dir', () => {
  console.log('injected', I, MyPage);
  I.openDir('aaa');
  I.seeFile('codecept.class.js');
  MyPage.hasFile('uu');
  I.seeFile('codecept.po.json');
});

Scenario('pageobject with context', async ({ I, MyPage, SecondPage }) => {
  I.openDir('aaa');
  I.seeFile('codecept.class.js');
  MyPage.hasFile('uu');
  I.seeFile('codecept.po.json');
  await SecondPage.assertLocator();
});
