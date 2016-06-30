import Emitter from 'wildemitter'

export default class Events {
  on (event, listener) {
    super.on(event, listener)
  }

  off (event, listener) {
    super.removeListener(event, listener)
  }

  /**
   *
   * Adds an event handler.
   *
   * It's possible to trigger multiple actions per path/event pair
   *
   * e.g.
   *
   *   dp.addEventHandler('click', '0:1:1', 'my-action')
   *   dp.addEventHandler('click', 'move-up', 'my-action')
   *
   * @param {String} type The type
   * @param {String} alias The path/alias
   * @param {String} action action name
   * @returns {undefined} Undefined
   */
  addEventHandler (type, alias, action) {
    const path = this.dp.dealias(alias)
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Map())
      this.dp.on(type, this._handleEvent.bind(this))
    }

    if (!this.handlers.get(type).has(path)) {
      this.handlers.get(type).set(path, [])
    }

    const actions = this.handlers.get(type).get(path)
    if (actions.indexOf(action) === -1) {
      actions.push(action)
    } else {
      throw Error(`Duplicate action "${action}" for path ${path}`)
    }
  }

  /**
   *
   * Remove event handler
   *
   * @param {String} type The type
   * @param {String} alias The path/alias
   * @param {String} action action name
   * @returns {undefined} Undefined
   */
  removeEventHandler (type, alias, action) {
    const path = this.dp.dealias(alias)
    if (this.handlers.has(type)) {
      if (this.handlers.get(type).has(path)) {
        const actions = this.handlers.get(type).get(path)
        const index = actions.indexOf(action)
        if (index >= 0) {
          actions.splice(index, 1)
          if (actions.length === 0) {
            this.handlers.get(type).delete(path)
            if (this.handlers.get(type).size === 0) {
              this.handlers.delete(type)
              this.dp.off(type)
            }
          }
        }
      }
    }
  }

  /**
   *
   * Remove all event handlers.
   *
   * If type is given will only remove those event types
   *
   * @param {String[]} type Event Type
   * @returns {undefined} Undefined
   */
  removeEventHandlers (type = []) {
    const types = Array.isArray(type) ? type : [type]
    for (const key of this.handlers.keys()) {
      if (!types.length || types.indexOf(key) >= 0) {
        this.dp.off(key)
        this.handlers.delete(key)
      }
    }
  }

  /**
   *
   * Takes a global event and test whether this path
   * or one of it's parents is listening for the event.
   *
   * @param {DomEvent} ev Event listener on window
   * @returns {undefined} Undefined
   */
  _handleEvent (ev) {
    // TODO: ev.preventDefault()
    ev.stopPropagation()
    if (!this.handlers.has(ev.type)) {
      return
    }

    const cp = this.dp.path(ev.srcElement).split(':')
    while (cp.length - 1) {
      let epath = cp.join(':')
      const el = this.dp.getRef(epath)

      // lookup original if there was no specific event specified for this row.
      // TODO: should it always also run an event handler defined for the source?
      if (!this.handlers.get(ev.type).has(epath)) {
        if (el.dataset && el.dataset.teflonOwner && el.dataset.teflonOwner !== epath) {
          // match as owner, emit as ourselves
          epath = el.dataset.teflonOwner
        }
      }

      if (this.handlers.get(ev.type).has(epath)) {
        const actions = this.handlers.get(ev.type).get(epath)
        for (const action of actions) {
          this.emit(action, ev, el)
        }
        // TODO: only break if stopPropagation
        break
      }
      cp.pop()
    }
  }
}

Emitter.mixin(Events)
