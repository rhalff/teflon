export function insertAfter(newNode, refNode) {
  return refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
}

export function mixin(target, source, inst = false) {
  const props = Object.getOwnPropertyNames(source.prototype)
  for (const name of props) {
    if (name !== 'constructor') {
      Object.defineProperty(
        inst ? target : target.prototype,
        name,
        Object.getOwnPropertyDescriptor(source.prototype, name)
      )
    }
  }
}
