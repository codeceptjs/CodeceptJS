const crypto = require('crypto');
const fs = require('fs');

class DigestHelper {
  static getMD5Digest(filePath) {
    const hash = crypto.createHash('md5');
    const data = fs.readFileSync(filePath);
    hash.update(data);

    return hash.digest('base64');
  }
}

module.exports = DigestHelper;
