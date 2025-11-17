// Abstract helper base class for testing imports
export abstract class AbstractHelper {
  protected config: any;

  constructor(config?: any) {
    this.config = config;
  }

  abstract customMethod(): string;
}

export class HelperUtils {
  static formatMessage(msg: string): string {
    return `[Helper] ${msg}`;
  }
}
