const testControllerHolder = {

  testController: undefined,
  captureResolver: undefined,
  getResolver: undefined,

  capture(t) {
    testControllerHolder.testController = t;

    if (testControllerHolder.getResolver) {
      // @ts-ignore
      testControllerHolder.getResolver(t);
    }

    return new Promise((resolve) => {
      // @ts-ignore
      testControllerHolder.captureResolver = resolve;
    });
  },

  free() {
    testControllerHolder.testController = undefined;

    if (testControllerHolder.captureResolver) {
      // @ts-ignore
      testControllerHolder.captureResolver();
    }
  },

  get() {
    return new Promise((resolve) => {
      if (testControllerHolder.testController) {
        resolve(testControllerHolder.testController);
      } else {
        // @ts-ignore
        testControllerHolder.getResolver = resolve;
      }
    });
  },
};

module.exports = testControllerHolder;
