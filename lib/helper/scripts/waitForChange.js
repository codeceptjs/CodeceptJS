export const waitForChange = ms =>
  new Promise(resolve => {
    const observer = new MutationObserver(() => {
      observer.disconnect()
      resolve()
    })
    observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true })
    setTimeout(() => {
      observer.disconnect()
      resolve()
    }, ms)
  })
