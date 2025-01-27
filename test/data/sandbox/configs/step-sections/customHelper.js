class CustomHelper extends Helper {
  act() {
    this.debug(JSON.stringify(arguments))
  }
}

module.exports = CustomHelper
