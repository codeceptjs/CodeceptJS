const assert = require('assert');
const { isInTraffic, createAdvancedTestResults, getTrafficDump } = require('./utils');

function dontSeeTraffic({ name, url }) {
  if (!this.recordedAtLeastOnce) {
    throw new Error('Failure in test automation. You use "I.dontSeeTraffic", but "I.startRecordingTraffic" was never called before.');
  }

  if (!name) {
    throw new Error('Missing required key "name" in object given to "I.dontSeeTraffic".');
  }

  if (!url) {
    throw new Error('Missing required key "url" in object given to "I.dontSeeTraffic".');
  }

  if (isInTraffic.call(this, url)) {
    assert.fail(`Traffic with name "${name}" (URL: "${url}') found, but was not expected to be found.`);
  }
}

async function seeTraffic({
  name, url, parameters, requestPostData, timeout = 10,
}) {
  if (!name) {
    throw new Error('Missing required key "name" in object given to "I.seeTraffic".');
  }

  if (!url) {
    throw new Error('Missing required key "url" in object given to "I.seeTraffic".');
  }

  if (!this.recording || !this.recordedAtLeastOnce) {
    throw new Error('Failure in test automation. You use "I.seeTraffic", but "I.startRecordingTraffic" was never called before.');
  }

  for (let i = 0; i <= timeout * 2; i++) {
    const found = isInTraffic.call(this, url, parameters);
    if (found) {
      return true;
    }
    await new Promise((done) => {
      setTimeout(done, 1000);
    });
  }

  // check request post data
  if (requestPostData && isInTraffic.call(this, url)) {
    const advancedTestResults = createAdvancedTestResults(url, requestPostData, this.requests);

    assert.equal(advancedTestResults, true, `Traffic named "${name}" found correct URL ${url}, BUT the post data did not match:\n ${advancedTestResults}`);
  } else if (parameters && isInTraffic.call(this, url)) {
    const advancedTestResults = createAdvancedTestResults(url, parameters, this.requests);

    assert.fail(
      `Traffic named "${name}" found correct URL ${url}, BUT the query parameters did not match:\n`
      + `${advancedTestResults}`,
    );
  } else {
    assert.fail(
      `Traffic named "${name}" not found in recorded traffic within ${timeout} seconds.\n`
      + `Expected url: ${url}.\n`
      + `Recorded traffic:\n${getTrafficDump.call(this)}`,
    );
  }
}

async function grabRecordedNetworkTraffics() {
  if (!this.recording || !this.recordedAtLeastOnce) {
    throw new Error('Failure in test automation. You use "I.grabRecordedNetworkTraffics", but "I.startRecordingTraffic" was never called before.');
  }

  const promises = this.requests.map(async (request) => {
    const resp = await request.response;

    if (!resp) {
      return {
        url: '',
        response: {
          status: '',
          statusText: '',
          body: '',
        },
      };
    }

    let body;
    try {
      // There's no 'body' for some requests (redirect etc...)
      body = JSON.parse((await resp.body()).toString());
    } catch (e) {
      // only interested in JSON, not HTML responses.
    }

    return {
      url: resp.url(),
      response: {
        status: resp.status(),
        statusText: resp.statusText(),
        body,
      },
    };
  });
  return Promise.all(promises);
}

function stopRecordingTraffic() {
  // @ts-ignore
  this.page.removeAllListeners('request');
  this.recording = false;
}

function flushNetworkTraffics() {
  this.requests = [];
}

module.exports = {
  dontSeeTraffic,
  seeTraffic,
  grabRecordedNetworkTraffics,
  stopRecordingTraffic,
  flushNetworkTraffics,
};
