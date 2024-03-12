let I;

export default {
  _init() {
    I = actor();
    this.value = 'Logs Page Value';
  },

  print(arg) {
    I.printMessage('Logs Page Message');
  },

  toString() {
    return this.value;
  },
};
