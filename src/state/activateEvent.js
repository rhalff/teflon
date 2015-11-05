export default function activateEvent(teflon, change) {
  return function activate() {
    if (change.op === 'remove') {
      teflon.removeEventHandler(change.name, change.path, change.val)
    } else {
      teflon.addEventHandler(change.name, change.path, change.val)
    }
  }
}

