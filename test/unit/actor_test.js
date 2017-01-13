'use strict';

let actor = require('../../lib/actor');
let container = require('../../lib/container');
let path = require('path');
let should = require('chai').should();
global.codecept_dir = path.join(__dirname, '/..');
let I;

describe('Actor', () => {

  beforeEach(() => {
    container.clear({
      MyHelper: {
        hello: () => 'hello world',
        bye: () => 'bye world',
        _hidden: () => 'hidden'
      },
      MyHelper2: {
        greeting: () => 'greetings, world'
      }
    });
    I = actor();
  });

  it('should take all methods from helpers and built in', () => {
    I.should.have.keys(['hello', 'bye', 'greeting', 'say']);
  });

  it('should return promise', () => {
    let recorder = require('../../lib/recorder');
    recorder.start();
    let promise = I.hello();
    promise.should.be.instanceOf(Promise);
    return promise.then((val) => val.should.eql('hello world'));
  });
});
