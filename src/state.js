import { copyObj } from './util'

/**
 *
 * A template can have several state assigned.
 *
 * In order to execute these states commands are generated.
 *
 * which can then be activated like:
 *
 *   dp.state.activate('command-name')
 *
 * And removed with:
 *
 *   dp.state.disable('command-name')
 *
 * Several states can be active at the same time.
 * Think of them as layers, with their own set of attributes and eventListeners.
 *
 */
export default class State {
  constructor (name, state, teflon) {
    this.name = name
    this.teflon = teflon
    this.isActive = false
    this.path = null
    this.events = state.events
    this.attributes = state.attributes
  }

  _activateEvent (change) {
    if (change.op === 'remove') {
      this.teflon.removeEventHandler(change.name, change.path, change.val)
    } else {
      this.teflon.addEventHandler(change.name, change.path, change.val)
    }
  }

  _disableEvent (change) {
    if (change.op === 'remove') {
      this.teflon.addEventHandler(change.name, change.path, change.val)
    } else {
      this.teflon.removeEventHandler(change.name, change.path, change.val)
    }
  }

  _setAttributes (change) {
    this.teflon.dp.setAttributes(change)
  }

  _revertAttributes (change) {
    this.teflon.dp.revertAttributes(change)
  }

  activate () {
    if (this.events) {
      for (const change of this.events) {
        this._applyPathToEvent(change)
        this._activateEvent(change)
      }
    }

    if (this.attributes) {
      this._applyPathToAttributes(this.attributes)
      this._setAttributes(this.attributes)
    }

    this.isActive = true
    return this
  }

  _applyPathToEvent (change) {
    if (this.path && !change.path) {
      change.path = this.path
    }
  }

  _applyPathToAttributes () {
    if (this.path) {
      for (const change of this.attributes) {
        if (this.path && !change.path) {
          change.path = this.path
        }
      }
    }
  }

  disable () {
    if (this.events) {
      for (const change of this.events) {
        this._applyPathToEvent(change)
        this._disableEvent(change)
      }
    }

    if (this.attributes) {
      this._applyPathToAttributes()
      this._revertAttributes(this.attributes)
    }

    this.isActive = false
    return this
  }

  clone (path) {
    if (this.path) {
      throw Error('Clone from master')
    }
    if (path) {
      const state = {}
      if (this.events) {
        state.events = copyObj(this.events)
      }
      if (this.attributes) {
        state.attributes = copyObj(this.attributes)
      }
      const instance = new State(this.name, state, this.teflon)
      instance.path = path
      return instance
    }
    throw Error('Clone needs a path')
  }
}
