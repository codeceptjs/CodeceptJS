'use strict';

let container = require('../container');
let event = require('../event');
let recorder = require('../recorder');
let debug = require('../output').debug;

let helpers = container.helpers();

let runHelpersHook = (hook, param) => {
  Object.keys(helpers).forEach((key) => {
    helpers[key][hook](param);
  });
};

let runAsyncHelpersHook = (hook, param) => {
  Object.keys(helpers).forEach((key) => {
    debug(`${key}.${hook}`);
    recorder.promise().then(() => helpers[key][hook](param));
  });
};

event.dispatcher.on(event.all.before, function () {
  runHelpersHook('_init');
});

event.dispatcher.on(event.test.before, function () {
  runAsyncHelpersHook('_before');
});

event.dispatcher.on(event.test.failed, function (test) {
  runAsyncHelpersHook('_failed', test);
});

event.dispatcher.on(event.test.after, function (test) {
  runAsyncHelpersHook('_after');
});

event.dispatcher.on(event.step.before, function (step) {
  runHelpersHook('_beforeStep', step);
});

event.dispatcher.on(event.step.after, function (step) {
  runHelpersHook('_afterStep', step);
});
