export abstract class AbstractHelper {
  protected config: any;
  constructor(config?: any) {
    this.config = config;
  }
  abstract customMethod(): string;
}
