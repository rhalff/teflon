export default function disableEvent(teflon, change) {
  return function disable() {
    if (change.op === 'remove') {
      teflon.addEventHandler(change.name, change.path, change.val)
    } else {
      teflon.removeEventHandler(change.name, change.path, change.val)
    }
  }
}

