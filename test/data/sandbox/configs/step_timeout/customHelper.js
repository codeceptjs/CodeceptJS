function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class CustomHelper extends Helper {
  exceededByTimeout(ms) {
    return sleep(ms);
  }

  waitForSleep(ms) {
    return sleep(ms);
  }

  statefulSleep(ms) {
    this.fraction = ++this.fraction || 1;
    return sleep(ms - 100 * this.fraction);
  }

  waitTadLonger(ms) {
    return sleep(ms);
  }

  waitTadShorter(ms) {
    return sleep(ms);
  }
}

module.exports = CustomHelper;
