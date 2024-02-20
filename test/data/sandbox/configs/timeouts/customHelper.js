function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class CustomHelper extends Helper {
  waitForSleep(ms) {
    return sleep(ms);
  }
}

export default CustomHelper;
