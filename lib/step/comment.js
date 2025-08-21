import FuncStep from './func.js'

class CommentStep extends FuncStep {
  constructor(name, comment) {
    super(name)
    this.fn = () => {}
  }
}

export default CommentStep
;