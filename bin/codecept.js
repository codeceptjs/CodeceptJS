'use strict';

var spawn = require('child_process').spawn
var args = [ __dirname + '/_codeceptjs' ];

process.argv.slice(2).forEach(function(arg){
  var flag = arg.split('=')[0];

  switch (flag) {
    case '--inspect':
      args.unshift('--debug-brk');
      args.unshift('--inspect');
      break;
    case '--debug-brk':
      args.unshift('--debug-brk');
      break;
    default:
      args.push(arg);
      break;
  }
});
var proc = spawn(process.argv[0], args, { stdio: [0,1,2] });
proc.on('exit', function (code, signal) {
  process.on('exit', function(){
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code);
    }
  });
});
