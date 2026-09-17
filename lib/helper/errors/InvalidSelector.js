class InvalidSelector extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidSelector'
  }
}

export default InvalidSelector
