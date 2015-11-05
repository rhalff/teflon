export default function setAttributes(teflon, change) {
  return function stateSetter() {
    teflon.dp.setAttributes(change)
  }
}

