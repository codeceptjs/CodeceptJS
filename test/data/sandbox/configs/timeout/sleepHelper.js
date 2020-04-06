const fs = require('fs');

class SleepHelper extends Helper {
  async sleep(ms) {
    console.log('Before sleep');
    const timeout = new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
    await timeout;
    console.log('After sleep');
  }

  async writeFile() {
    return fs.writeFileSync('test.txt', 'qweq');
  }
}

module.exports = SleepHelper;
