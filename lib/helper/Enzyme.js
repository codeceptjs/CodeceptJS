const enzyme = requireg('enzyme');
const Adapter = requireg('enzyme-adapter-react-16');

class Enzyme extends Helper {

  constructor(config) {
    super(config);
    this._validateConfig(config);
  }

  _validateConfig(config) {
    this.options = {};

    enzyme.configure({ adapter: new Adapter() });
    // override defaults with config
    Object.assign(this.options, config);
  }

  static _checkRequirements() {
    try {
      requireg('enzyme');
    } catch (e) {
      return ['enzyme'];
    }
  }

  mountComponent(component) {
    this.wrapper = enzyme.mount(component);
    return this.wrapper;
  }

  shallowComponent(component) {
    this.wrapper = enzyme.shallow(component);
    return this.wrapper;
  }

  _after() {
    if (this.wrapper) {
      return this.wrapper.unmount();
    }
  }

  _failed() {
  }

}

module.exports = Enzyme;
