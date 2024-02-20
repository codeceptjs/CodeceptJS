class Run {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  setOriginalName(originalName) {
    this.originalName = originalName;
  }

  getOriginalName() {
    return this.originalName;
  }

  getName() {
    return this.name;
  }

  getConfig() {
    return this.config;
  }
}

export function createRun(name, config) {
  return new Run(name, config);
};
