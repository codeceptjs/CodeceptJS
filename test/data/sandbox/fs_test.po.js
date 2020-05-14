const fs = require('fs');
const path = require('path');

Feature('Filesystem');

Scenario('check current dir', (I, MyPage) => {
  I.openDir('aaa');
  I.seeFile('codecept.json');
  MyPage.hasFile('First arg', 'Second arg');
  // fs.readFileSync()
  const fileName = path.join(process.cwd(), 'codecept.json');
  const stats = fs.statSync(fileName);
  // eslint-disable-next-line no-buffer-constructor
  const buffer = new Buffer(stats.size);
  // MyPage.hasFile(buffer);
  I.seeFile({ name: 'asdas', buffer });
});
