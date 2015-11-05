import {activateEvent, disableEvent, setAttributes, revertAttributes} from './state/index'

/**
 *
 * A template can have several state assigned.
 *
 * In order to execute these states commands are generated.
 *
 * which can then be activated like:
 *
 *   dp.state.set('command-name')
 *
 * And removed with:
 *
 *   dp.state.del('command-name')
 *
 * Several states can be active at the same time.
 * Think of them as layers, with their own set of attributes and eventListeners.
 *
 */
export default class State {
  constructor(name, state, teflon) {
    this.name = name
    this.fns = []
    this.rfns = []
    this.isActive = false
    const { events, attributes } = state

    if (events) {
      for (const change of events) {
        this.fns.push(activateEvent(teflon, change))
        this.rfns.push(disableEvent(teflon, change))
      }
    }

    if (attributes) {
      this.fns.push(setAttributes(teflon, attributes))
      this.rfns.push(revertAttributes(teflon, attributes))
    }
  }

  activate() {
    for (const func of this.fns) {
      func()
    }
    this.isActive = true
  }

  disable() {
    for (const func of this.rfns) {
      func()
    }
    this.isActive = false
  }
}

