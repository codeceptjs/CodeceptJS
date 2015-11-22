'use strict';

var Codecept = require('./../codecept');
let container = require('./../container');
let getParamNames = require('./../utils').getParamNames;

let objects = container.support();

let I = objects.I;
let params;

// vorpal
//   .mode('repl')
//   .description('Enters the user into a REPL session.')
//   .delimiter('repl:')
//   .action(function(command, callback) {
//     eval('I.'+command);
//   });

for (let method in I) {
  params = getParamNames(I[method]);
  
  vorpal.command(`${method} [params...]`).action(function(args, callback) {
    I[method].apply(I, args.params).then(() => {
      return callback();
    });
  });
}

 
module.exports = function() {
  
  vorpal.show();
}