// Need for testing pages
import { actor } from '../../../../../../lib/index.js';

export default () => {
  return actor({
    openDir() {
      this.amInPath('.');
    },
  });
};
