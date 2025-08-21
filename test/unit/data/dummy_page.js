export default {
  openDummyPage: () => 'dummy page opened',
  getI: () => {
    // This function is called within test context where inject is available
    if (typeof inject !== 'undefined') {
      const { I } = inject()
      return I
    }
    return null
  },
}
