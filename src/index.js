import DomPointer from 'dompointer'
import Emitter from 'wildemitter'
import Dot from 'dot-object'
import State from './state'
import { mixin } from './util'
import Repeat from './data/repeat'

export default class Teflon {
  constructor(dp) {
    this.dp = dp
    this.handlers = {}
    this.state = {}

    this.maps = {
      data: {}
    }
  }

  static create(el) {
    return new Teflon(DomPointer.create(el))
  }

  /**
   *
   * Supplies the maps associated with this template.
   *
   * @param {String} name Link identifier
   * @param {String} type map type, 'data|template'
   * @param {Object} map map
   * @returns {Teflon} this instance
   */
  link(name, type, map) {
    if (!this.maps.hasOwnProperty(type)) {
      throw Error('Unknown mapping type: ' + type)
    }
    this.maps[type][name] = map
    return this
  }

  /**
   *
   * Fills the template with data.
   *
   * @param {Object} name Data map name
   * @param {Object} data The actual data object.
   * @param {Boolean} append whether to append the data
   * @returns {Teflon} this instance
   */
  fill(name, data, append) {
    // data map contains pointers, and dotted path of data.
    // the dotted path will be constructed from a schema
    if (!this.maps.data.hasOwnProperty(name)) {
      throw Error('No such data map: ' + name)
    }
    const map = this.maps.data[name]
    this._fill(map, data, append)
    return this
  }

  _fill(map, data, append, ptpath) {
    Object.keys(map).forEach((tpath) => {
      const dpath = map[tpath]
      if (dpath.constructor.name === 'Object') {
        /*
         const dmap = {
           ':0:1': { // panel-body
             path: 'my.items',
             // items: ':0' // same as ':0:1:0': 'my.items'
             items: {
              ':0': 'title', // the text
              ':1': 'desc'   // the <p>
             }
           }
         }
         */
        if (dpath.hasOwnProperty('path')) {
          const val = Dot.pick(dpath.path, data)
          if (dpath.hasOwnProperty('items')) {
            if (!Array.isArray(val)) {
              throw Error('items defined, but picked data is not of the array type')
            }
            // processItems
            if (typeof dpath.items === 'string') {
              this.dp.data(tpath, val) // simple default.
            } else if (typeof dpath.items === 'object') {
              this.repeat(dpath.items, val, tpath, append)
            } else {
              throw Error('Unknown items type', typeof dpath.items)
            }
          }
        } else {
          // not array, should recurse..
          // { 'my-bla' : { ':0': 'my.path'} }
          Object.keys(dpath).forEach((key) => {
            this.dp.data(key, Dot.pick(dpath[key], data), tpath)
          })
        }
      } else if (typeof dpath === 'string') {
        const val = Dot.pick(dpath, data)
        this.dp.data(tpath, val, ptpath)
      } else {
        throw Error('Don\'t know how to handle data path of type: ' + typeof dpath)
      }
      /*
       const p = castArray(map[path])
       const val = Dot.pick(path, data)
       for (const i = 0; i < p.length; i++) {
         // here p[i] can be an object. which is special case.
         if (p[i].constructor.name === 'Object') {
           throw Error('not implemented')
           // if this is the case, recursion takes place.
         } else {
           this.data(p[i], val)
         }
       }
       */
    })
  }

  on(event, listener) {
    super.on(event, listener)
  }

  off(event, listener) {
    super.removeListener(event, listener)
  }

  /**
   *
   * Renders the current node.
   *
   * Never should have to be called directly.
   *
   * Rendering is based on data changes.
   *
   * @returns {Teflon} this instance
   */
  render() {
    this.dp.render()
    return this
  }

  /**
   *
   * Takes a global event and test whether this path
   * or one of it's parents is listening for the event.
   *
   * @param {DomEvent} ev Event listener on window
   * @returns {undefined} Undefined
   */
  _handleEvent(ev) {
    // TODO: ev.preventDefault()
    ev.stopPropagation()
    if (!this.handlers.hasOwnProperty(ev.type)) {
      return
    }

    const cp = this.dp.path(ev.srcElement).split(':')
    while (cp.length) {
      let epath = cp.join(':')
      const el = this.dp.getRef(epath)

      if (el.dataset && el.dataset.teflonOwner && el.dataset.teflonOwner !== epath) {
        // match as owner, emit as ourselves
        epath = el.dataset.teflonOwner
      }

      if (this.handlers[ev.type].hasOwnProperty(epath)) {
        const actions = this.handlers[ev.type][epath]
        for (const action of actions) {
          this.emit(action, ev, el)
        }
        // TODO: only break if stopPropagation
        break
      }
      cp.pop()
    }
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
  addEventHandler(type, alias, action) {
    const path = this.dp.dealias(alias)
    if (!this.handlers.hasOwnProperty(type)) {
      this.handlers[type] = {}
      this.dp.on(type, this._handleEvent.bind(this))
    }

    if (!this.handlers[type].hasOwnProperty(path)) {
      this.handlers[type][path] = []
    }

    const actions = this.handlers[type][path]
    if (actions.indexOf(action) === -1) {
      actions.push(action)
    } else {
      throw Error(`Duplicate action "${action}" for path ${path}`)
    }
  }

  /**
   *
   * Set target element
   *
   * @param {HTMLElement} el HTML Element
   * @returns {Teflon} this instance
   */
  setElement(el) {
    this.dp.reset(true)
    this.dp.setElement(el)
    return this
  }

  /**
   * Render
   *
   * @returns {Teflon} this instance
   */
  render() {
    this.dp.render()
    return this
  }

  /**
   *
   * Get target element
   *
   * @returns {HTMLElement} HTML Element
   */
  getElement() {
    return this.dp.el
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
  removeEventHandler(type, alias, action) {
    const path = this.dp.dealias(alias)
    if (this.handlers.hasOwnProperty(type)) {
      if (this.handlers[type].hasOwnProperty(path)) {
        const actions = this.handlers[type][path]
        const index = actions.indexOf(action)
        if (index >= 0) {
          actions.splice(index, 1)
          if (actions.length === 0) {
            delete this.handlers[type][path]
            if (Object.keys(this.handlers[type]).length === 0) {
              delete this.handlers[type]
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
  removeEventHandlers(type = []) {
    const types = Array.isArray(type) ? type : [type]
    Object.keys(this.handlers).forEach((key) => {
      if (!types.length || types.indexOf(key) >= 0) {
        this.dp.off(key)
        delete this.handlers[key]
      }
    })
  }

  /**
   *
   * Set source HTML for this instance.
   *
   * @param {String} html HTML String
   * @returns {Teflon} this instance
   */
  setHTML(html) {
    this.dp.setHTML(html)
    return this
  }

  /**
   *
   * Load the template along with it's definition.
   *
   * @param {Object} map Definition map
   * @param {Object} map.template Template map def
   * @param {Object} map.data Data map def
   * @param {Object} map.state State map def
   * @returns {Teflon} this instance
   */
  load(map) {
    // set parse html and set it as default view
    return this.setTemplateMap(map.template)
      .setDataMap(map.data)
      .setStateMap(map.state)
  }

  /**
   * Set template map
   *
   * @param {Object} map Template map
   * @returns {Teflon} this instance
   */
  setTemplateMap(map) {
    if (this.dp.refs.size) {
      this.dp.reset()
    }
    Object.keys(map).forEach((key) => {
      this.dp.alias(key, map[key])
    })
    return this
  }

  /**
   *
   * Set data map
   *
   * @param {Object} map Map
   * @returns {Teflon} this instance
   */
  setDataMap(map) {
    Object.keys(map).forEach((name) => {
      this.link(name, 'data', map[name])
    })
    return this
  }

  /**
   *
   * Has state
   *
   * @param {String} name State name to test
   * @returns {Boolean} Whether this state exists
   */
  hasState(name) {
    return this.state.hasOwnProperty(name)
  }

  /**
   *
   * Has state
   *
   * @param {String} name State name to test
   * @returns {Boolean} Whether this state exists
   */
  getState(name) {
    if (this.state.hasOwnProperty(name)) {
      return this.state[name]
    }
    throw Error(`State ${name} does not exist`)
  }

  /**
   *
   * Whether this state is activated
   *
   * @param {String} name State name to test
   * @returns {Boolean} Whether this state is activated
   */
  inState(name) {
    return this.getState(name).isActive
  }

  /**
   *
   * Activates a predefined state
   *
   * @param {String} name State name to activate
   * @returns {Teflon} this instance
   */
  activateState(name) {
    if (this.inState(name)) {
      throw Error(`State ${name} already activated`)
    }
    this.getState(name).activate()
    return this
  }

  /**
   *
   * disables a predefined state
   *
   * @param {String} name State name to disable
   * @returns {Teflon} this instance
   */
  disableState(name) {
    if (!this.inState(name)) {
      throw Error(`State ${name} is already disabled`)
    }
    this.getState(name).disable()
    return this
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
  addState(name, state) {
    if (!this.state.hasOwnProperty(name)) {
      this.state[name] = new State(name, state, this)
      return this
    }
    throw Error(`State "${name}" already added`)
  }

  /**
   *
   * Removes a state
   *
   * @param {String} name State name
   * @returns {Teflon} this instance
   */
  removeState(name) {
    if (this.state.hasOwnProperty(name)) {
      this.disableState()
      delete this.state[name]
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
  setStateMap(map) {
    Object.keys(map).forEach((name) => {
      this.addState(name, map[name])
    })
    if (this.hasState('default')) {
      this.activateState('default')
    }
    return this
  }
}

Emitter.mixin(Teflon)
mixin(Teflon, Repeat)
