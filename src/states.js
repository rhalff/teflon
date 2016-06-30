import State from './state'

export default class States {
  /**
   *
   * Has state
   *
   * @param {String} name State name to test
   * @param {String} path Instance path
   * @returns {Boolean} Whether this state exists
   */
  hasState (name, path) {
    if (this.state.has(name)) {
      if (path) {
        const state = this.state.get(name)
        return state.constructor.name === 'Map' && state.has(path)
      }
      return true
    }
    return false
  }

  /**
   *
   * Get state
   *
   * @param {String} name State name to test
   * @param {String} path Instance path
   * @returns {Boolean} Whether this state exists
   */
  getState (name, path) {
    if (this.hasState(name, path)) {
      if (path) {
        return this.state.get(name).get(path)
      }
      return this.state.get(name)
    }
    throw Error(`State ${name} does not exist`)
  }

  /**
   *
   * Whether this state is activated
   *
   * @param {String} name State name to test
   * @param {String} path Instance path
   * @returns {Boolean} Whether this state is activated
   */
  inState (name, path) {
    return this.getState(name, path).isActive
  }

  toggleState (name, path, clear) {
    if (!this.hasState(name, path) || !this.inState(name, path)) {
      if (clear) {
        // BIG HACK, it includes the init.
        this.activateState(name, path)
        this.disableAll(name)
      }
      this.activateState(name, path)
    } else {
      this.disableState(name, path)
    }
  }

  /**
   *
   * Activates a predefined state
   *
   * @param {String} name State name to activate
   * @param {String} path Instance path
   * @returns {Teflon} this instance
   */
  activateState (name, path) {
    if (path && !this.hasState(name, path)) {
      if (!this._prototype[name]) {
        this._prototype[name] = this.getState(name)
        this.state.set(name, new Map())
      }
      this.getState(name).set(path, this._prototype[name].clone(path))
    }
    if (this.inState(name, path)) {
      const fname = path ? `${name}[${path.split(':').pop()}]` : name
      throw Error(`State ${fname} already activated`)
    }
    this.getState(name, path).activate()
    return this
  }

  /**
   *
   * disables a predefined state
   *
   * @param {String} name State name to disable
   * @param {String} path Instance path
   * @returns {Teflon} this instance
   */
  disableState (name, path) {
    if (!this.inState(name, path)) {
      throw Error(`State ${name} is already disabled`)
    }
    this.getState(name, path).disable()
    return this
  }

  disableAll (name) {
    const state = this.state.get(name)
    if (state.constructor.name === 'Map') {
      for (const path of state.keys()) {
        if (this.inState(name, path)) {
          this.disableState(name, path)
        }
      }
    } else {
      throw Error('disableAll can only be used for instances')
    }
  }

  /**
   *
   * Adds a new state in addition of the defaultState.
   *
   * A state consists of attribute changes and/or event handler changes.
   *
   * @param {String} name State name
   * @param {Map} state States Definition
   * @returns {Teflon} this instance
   */
  addState (name, state) {
    if (!this.state.has(name)) {
      this.state.set(name, new State(name, state, this))
      return this
    }
    throw Error(`State "${name}" already added`)
  }

  /**
   *
   * Removes a state
   *
   * @param {String} name State name
   * @param {String} path Instance path
   * @returns {Teflon} this instance
   */
  removeState (name, path) {
    if (this.hasState(name, path)) {
      this.disableState(name, path)
      if (path) {
        this.state.get(name).delete(path)
      } else {
        this.state.delete(name)
      }
      return this
    }
    throw Error(`State "${name}" does not exist`)
  }

  /**
   *
   * Set the state map for this template
   *
   * @param {Object} map State map
   * @param {Object} map.events State Events
   * @param {Object} map.attributes State Attributes
   * @returns {Teflon} this instance
   */
  setStateMap (map) {
    Object.keys(map).forEach((name) => {
      this.addState(name, map[name])
    })
    if (this.hasState('default')) {
      this.activateState('default')
    }
    return this
  }
}
