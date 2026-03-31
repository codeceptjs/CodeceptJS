class NonFocusedType extends Error {
  constructor() {
    super(
      'No element is in focus. Use I.click() or I.focus() to activate an element before calling I.type(). '
      + 'This error is thrown because strict mode is enabled.',
    )
    this.name = 'NonFocusedType'
  }
}

export default NonFocusedType
