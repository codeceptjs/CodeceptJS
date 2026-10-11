export default function layoutProbe() {
  const style = document.createElement('style')
  style.textContent = '.__codecept-layout-probe{display:none}'
  document.documentElement.appendChild(style)
  const probe = document.createElement('div')
  probe.className = '__codecept-layout-probe'
  ;(document.body || document.documentElement).appendChild(probe)
  const display = getComputedStyle(probe).display
  style.remove()
  probe.remove()
  return display
}
