export function createElement (html) {
  const div = document.createElement('div')
  div.innerHTML = html

  return div
}

export function printFrag (df) {
  const inner = document.createElement('div')
  for (const node of df.childNodes) {
    inner.appendChild(node.cloneNode(true))
  }
  return inner.innerHTML
}

export function click (el) {
  const ev = document.createEvent('MouseEvents')
  // deprecated but works
  ev.initMouseEvent(
    'click',
    true, true,
    document.defaultView,
    0, 0, 0, 0, 0,
    false, false, false,
    0,
    null, null
  )
  el.dispatchEvent(ev)
}
