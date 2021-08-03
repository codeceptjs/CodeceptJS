function ConnectionRefused(err) {
  this.message = "Can't connect to WebDriver.\n";
  this.message += `${err}\n\n`;
  this.message += 'Please make sure Selenium Server is running and accessible';
  this.stack = err.stack;
}

ConnectionRefused.prototype = Object.create(Error.prototype);

module.exports = ConnectionRefused;
