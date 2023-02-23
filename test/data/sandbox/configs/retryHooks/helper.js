class CustomHelper extends Helper {
  _beforeSuite() {
    this.i = 0;
  }

  _before() {
    this.i = 0;
  }

  async failIfNotWorks() {
    return new Promise((resolve, reject) => {
      this.i++;
      console.log('check if i <3', this.i);
      setTimeout(() => {
        if (this.i >= 3) resolve();
        reject(new Error('not works'));
      }, 0);
    });
  }
}

module.exports = CustomHelper;
