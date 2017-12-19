const baseDOM = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>';
const JSDOM = require('jsdom').JSDOM;

global.window = (new JSDOM(baseDOM)).window;
global.document = global.window.document;
if (global.self === null) {
  global.self = global.this;
}
global.navigator = {
  userAgent: 'node.js',
};
