'use strict';
let container = require('./container');
let recorder = require('./recorder');
let output = require('./output');
let methodsOfObject = require('./utils').methodsOfObject;

let readline = require('readline')
let util = require('util')
let colors = require('colors') // npm install colors
let rl;

function completer(line) {
  let I = container.support('I');
  var completions = methodsOfObject(I);
  var hits = completions.filter(function(c) {
    if (c.indexOf(line) == 0) {
      // console.log('bang! ' + c);
      return c;
    }
  });
  return [hits && hits.length ? hits : completions, line];
}

function askForStep(done) {
  return new Promise(function(resolve) {  
    let I = container.support('I');
    
    rl.setPrompt(' I.', 3);
    rl.prompt();
    rl.on('line', function(cmd) {
        if (!cmd) {
          done();
          recorder.session.restore();
          rl.close();
          return resolve();
        }
        try {   
          eval('I.'+cmd);
        } catch (err) {
          output.print(output.styles.error(" ERROR "), err.message);
        }
        recorder.session.catch(function(err) {
          let msg = err.cliMessage ? err.cliMessage() : err.message;
          return output.print(output.styles.error(" FAIL "), msg);
        });
        recorder.add(() => askForStep(done));
        resolve();              
    })    
  });
}

module.exports = function() {
  recorder.add(function() {
    recorder.session.start();
    output.print(colors.yellow(" Interative debug session started"));
    output.print(colors.yellow(" Use JavaScript syntax to try steps in action"));
    output.print(colors.yellow(` Press ${colors.bold('ENTER')} to resume test`));
    rl = readline.createInterface(process.stdin, process.stdout, completer);
    rl.on('close', function() {
      console.log('Resuming test execution....');
    })
    return new Promise(function(resolve) {
      return askForStep(resolve);
    });     
  });
}