const fs = require('fs');
const { resolve } = require('path');

const filePath = [resolve('./typings/promiseBasedTypes.d.ts'), resolve('./typings/types.d.ts')];

filePath.forEach(file => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading the file: ${err}`);
      return;
    }

    const modifiedContent = modifyContent(data);

    // Write the modified content back to the file
    fs.writeFile(file, modifiedContent, 'utf8', (err) => {
      if (err) {
        console.error(`Error writing to the file: ${err}`);
        return;
      }

      console.log(`${file} file is successfully modified and saved.`);
    });
  });
});

function modifyContent(content) {
  const modifiedContent = content.replace(/    class MockServer {/g, '    // @ts-ignore\n'
    + '    class MockServer {').replace(/    type MockServerConfig = {/g, '    // @ts-ignore\n'
    + '    type MockServerConfig = {').replace(/    class ExpectHelper {/g, '    // @ts-ignore\n'
    + '    class ExpectHelper {');
  return modifiedContent;
}
