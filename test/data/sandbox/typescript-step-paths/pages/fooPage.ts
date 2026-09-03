export {}

const { I } = inject()

export default {
  open() {
    I.doThing('from page')
  },
}
