const { I } = inject()

export default {
  actOnPage: () => {
    I.act('actOnPage')
    I.act('see on this page')
  },
}
