const FuncStep = require('./func')

class CommentStep extends FuncStep {
  constructor(name, comment) {
    super(name)
    this.fn = () => {}
  }
}

module.exports = CommentStep
