var spawn = require('child_process').spawn;
var path = require('path');
var sleep = require('sleep').sleep;

function Bootstrap(codecept, callback) {

  var phantomjs, seleniumPid, callbackCalled = false;

  (function () {

    var protractor = codecept.config.helpers.Protractor;
    if (protractor && protractor.browser) {
      if (/phantom/.test(protractor.browser)) {
        var phantomPath = require('phantomjs').path || '/usr/local/bin/phantomjs';
        phantomjs = spawn(phantomPath,['--webdriver=4444']);

        phantomjs.stdout.on('data', function (data) {
          if (!callbackCalled) {
            callback();
            callbackCalled = true;
          }
        });

        process.on('exit', function () {
          phantomjs.stdin.pause();
          phantomjs.kill();
        });

      }else {

        var binPath = path.join(path.dirname(require.resolve('protractor')),'..','..','.bin');
        var webdriver = spawn(path.join(binPath,'webdriver-manager'),['start']);

        webdriver.stdout.on('data', function (data) {

          // Workaround to wait execution of selenium .jar
          sleep(2);

          var output = data.toString();
          if (/seleniumProcess.pid/.test(output)) {
            seleniumPid = output.match(/:\s\d{1,}/)[0].replace(/:\s/,'');
          }
          if (!callbackCalled) {
            callback();
            callbackCalled = true;
          }
        });

        process.on('exit', function () {
          webdriver.stdout.pause();
          webdriver.kill();

          if (seleniumPid) {
            process.kill(seleniumPid, 'SIGINT');
          }
        });

      }
    }

  })();

}

module.exports = Bootstrap;
