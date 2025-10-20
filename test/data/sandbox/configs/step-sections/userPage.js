const { I } = inject()

module.exports = {
  actOnPage: () => {
    I.act('actOnPage')
    I.act('see on this page')
  },
}
