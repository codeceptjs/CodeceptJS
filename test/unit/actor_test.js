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
  
  it('should take all methods of helpers', () => {    
    I.should.have.keys(['hello', 'bye', 'greeting']);
  });
  
  it('should wrap methods into promise', () => {
    I.hello.toString().should.include('recorder.addStep');
  });

  it('should return promise', () => {
    let recorder = require('../../lib/recorder');
    recorder.start();
    I.hello().should.be.instanceOf(Promise);
  });
});