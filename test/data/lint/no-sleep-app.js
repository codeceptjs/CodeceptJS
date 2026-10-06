export default class Poller {
  start() {
    setTimeout(() => this.tick(), 100)
  }
}
