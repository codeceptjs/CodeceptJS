'use strict';

let event = require('../event');

let failed = false;

event.dispatcher.on(event.test.failed, function () {
  failed = true;
});

event.dispatcher.on(event.all.result, function () {
  if (failed) process.exit(1);
});
