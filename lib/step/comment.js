import FuncStep from './func.js'

class CommentStep extends FuncStep {
  constructor(title, comment) {
    super(title)
    this.fn = () => {}
  }
}

export default CommentStep
