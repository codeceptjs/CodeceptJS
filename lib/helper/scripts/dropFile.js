export const dropFile = (el, { base64Content, fileName, mimeType }) => {
  const binaryStr = atob(base64Content)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
  const fileObj = new File([bytes], fileName, { type: mimeType })
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(fileObj)
  el.dispatchEvent(new DragEvent('dragenter', { dataTransfer, bubbles: true }))
  el.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true }))
  el.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true }))
}
