const Helper = codecept_helper;

const crypto = require('crypto');
const fs = require('fs');

class DigestHelper extends Helper {
  getMD5Digests(files = []) {
    const digests = [];

    for (const file of files) {
      const hash = crypto.createHash('md5');
      const data = fs.readFileSync(file);
      hash.update(data);

      digests.push(hash.digest('base64'));
    }

    return digests;
  }
}

module.exports = DigestHelper;
