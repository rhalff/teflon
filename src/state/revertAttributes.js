export default function revertAttributes(teflon, change) {
  return function stateReverter() {
    teflon.dp.revertAttributes(change)
  }
}

