function RemoteBrowserConnectionRefused(err) {
  this.message = 'Cannot connect to websocket endpoint.\n\n';
  this.message += 'Please make sure remote browser is running and accessible.';
  this.stack = err.error || err;
}

RemoteBrowserConnectionRefused.prototype = Object.create(Error.prototype);

module.exports = RemoteBrowserConnectionRefused;
