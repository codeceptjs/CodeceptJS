import { actor } from '../../../../lib/index.js';

let I;

export default {

  _init() {
    I = actor();
  },

  hasFile(arg) {
    I.seeFile('codecept.js');
    I.seeFile('codecept.po.js');
  },
};
