export const CLIPBOARD_READ_TIMEOUT_MS = 5000

export function readClipboardScript(timeout) {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    throw new Error('Clipboard API is not available on this page, it requires a secure context (https or localhost)')
  }
  return Promise.race([navigator.clipboard.readText(), new Promise((resolve, reject) => setTimeout(() => reject(new Error('timed out while reading the clipboard')), timeout))])
}

export function writeClipboardScript(text) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    throw new Error('Clipboard API is not available on this page, it requires a secure context (https or localhost)')
  }
  return navigator.clipboard.writeText(text)
}

export function clipboardExpression(script, arg) {
  return `(${script.toString()})(${JSON.stringify(arg)})`
}

export function clipboardAsyncScript(script) {
  return `
    var done = arguments[arguments.length - 1]
    var fail = function (err) { done({ error: (err && err.message) || String(err) }) }
    try {
      (${script.toString()})(arguments[0]).then(function (value) { done({ value: value }) }, fail)
    } catch (err) {
      fail(err)
    }
  `
}
