let I

const LogsPage = {
  _init() {
    I = actor()
    this.value = 'Logs Page Value'
  },

  print(arg) {
    I.printMessage('Logs Page Message')
  },

  toString() {
    return this.value
  },
}

export default LogsPage
