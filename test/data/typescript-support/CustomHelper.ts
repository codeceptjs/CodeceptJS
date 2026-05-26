// TypeScript custom helper for testing
class CustomHelper {
  constructor(config: any) {
    this.config = config
  }

  config: any

  customMethod(): string {
    return 'TypeScript helper loaded successfully'
  }

  async asyncCustomMethod(): Promise<string> {
    return 'Async TypeScript helper method'
  }
}

export default CustomHelper
