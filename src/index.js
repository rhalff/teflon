import DomPointer from 'dompointer'
import { EventEmitter } from 'events'
import Dot from 'dot-object'

export default class Teflon extends EventEmitter {

  constructor(dp) {
    super()

    this.dp = dp
    this.handlers = {}
    this.state = {}

    this.maps = {
      data: {},
      template: new Map(),
      reverseTemplateMap: {}
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
              this.data(dpath.items, val, tpath, append)
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
   */
  render() {
    this.dp.render()
  }

  /**
   *
   * Takes a global event and test whether this path
   * or one of it's parents is listening for the event.
   *
   * @param {DomEvent} ev Event listener on window
   */
  _handleEvent(ev) {
    // TODO: ev.preventDefault()
    ev.stopPropagation()
    if (!this.handlers.hasOwnProperty(ev.type)) {
      return
    }

    const cp = this.dp.path(ev.srcElement).split(':')
    while (cp.length) {
      const path = cp.join(':')
      if (this.handlers[ev.type].hasOwnProperty(path)) {
        // todo: should do own propagate.
        const actions = this.handlers[ev.type][path]
        actions.forEach((path) => {
          this.emit(path, ev)
        })
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
   */
  addEventHandler(type, alias, action) {
    const path = this.dp._dealias(alias)
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
   */
  setElement(el) {
    this.dp.setElement(el)
  }

  /**
   * Render
   *
   */
  render() {
    this.dp.render()
  }

  /**
   *
   * Get target element
   *
   * @param {HTMLElement} el HTML Element
   */
  getElement(el) {
    return this.dp.el
  }

  /**
   *
   * Remove event handler
   *
   * @param {String} type The type
   * @param {String} alias The path/alias
   * @param {String} action action name
   */
  removeEventHandler(type, alias, action) {
    const path = this.dp._dealias(alias)
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
   * @param {String} type Event Type
   */
  removeEventHandlers(type) {
    Object.keys(this.handlers).forEach((type) => {
      this.dp.off(type)
      delete this.handlers[type]
    })
  }

  /**
   *
   * Set source HTML for this instance.
   *
   * @param {String} html HTML String
   */
  setHTML(html) {
    this.dp.setHTML(html)
  }

  /**
   *
   * Adds a new state in addition of the defaultState.
   *
   * A state consists of attribute changes and/or event handler changes.
   *
   * @param {String} stateName State name
   * @param {Map} state States map
   */
  addState(stateName, state) {
    this.state[stateName] = state
  }

  /**
   *
   * Load the template along with it's definition.
   *
   * @param {Object} map Definition map
   * @param {Object} map.template Template map def
   * @param {Object} map.data Data map def
   * @param {Object} map.state State map def
   */
  load(map) {
    // set parse html and set it as default view
    this.setTemplateMap(map.template)
    this.setDataMap(map.data)
    this.setStateMap(map.state)
  }

  /**
   * Set template map
   *
   * TODO: reset logic is already implemented within dom pointer (I think)
   *
   * @param {Object} map Template map
   */
  setTemplateMap(map) {
    if (this.dp.refs.size) {
      this.dp.reset()
    }
    Object.keys(map).forEach((key) => {
      this.dp.alias(key, map[key])
    })
  }

  /**
   *
   * Set data map
   *
   * @param {Object} map Map
   */
  setDataMap(map) {
    Object.keys(map).forEach((name) => {
      this.link(name, 'data', map[name])
    })
  }

  /**
   *
   * A template can have several state assigned.
   *
   * In order to execute these states commands are generated.
   *
   * which can then be actived like:
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
   * @param {String} name Name
   * @param {Object} state State definition
   * @returns {function(this:{fns: Array})}
   */
  createCommand(name, state) {
    const fns = []
    const rfns = []
    const _this = this

    function activate(change) {
      return () => {
        if (change.op === 'remove') {
          _this.removeEventHandler(change.name, change.path, change.val)
        } else {
          _this.addEventHandler(change.name, change.path, change.val)
        }
      }
    }

    function disable(change) {
      return () => {
        if (change.op === 'remove') {
          _this.addEventHandler(change.name, change.path, change.val)
        } else {
          _this.removeEventHandler(change.name, change.path, change.val)
        }
      }
    }

    if (state.events) {
      state.events.forEach((change) => {
        fns.push(activate(change))
        rfns.push(disable(change))
      })
    }

    if (state.attributes) {
      const { attributes: change } = state
      fns.push(() => {
        this.dp.setAttributes(this.change)
      }.bind({change: change}))

      rfns.push(() => {
        this.dp.revertAttributes(this.change)
      }.bind({change: change}))
    }

    function createCommand(fns) {
      return () => {
        for (let i = 0; i < fns.length; i++) {
          fns[i]()
        }
      }
    }

    const api = {
      activate: createCommand(fns).bind(this),
      disable: createCommand(rfns).bind(this)
    }

    return api
  }

  /**
   *
   * Activates a predefined state
   *
   * @param {String} name State name to activate
   */
  activateState(name) {
    if (this.state.hasOwnProperty(name)) {
      this.state[name].activate()
    }
  }

  /**
   *
   * disables a predefined state
   *
   * @param {String} name State name to disable
   */
  disableState(name) {
    if (this.state.hasOwnProperty(name)) {
      this.state[name].disable()
    }
  }

  /**
   *
   * Adds a new state
   *
   * @param {String} name State name
   * @param {Object} state State Definition
   */
  addState(name, state) {
    if (!this.state.hasOwnProperty(name)) {
      this.state[name] = this.createCommand(name, state)
    } else {
      throw Error(`State "${name}" already added`)
    }
  }

  /**
   *
   * Removes a state
   *
   * @param {String} name State name
   */
  removeState(name) {
    if (this.state.hasOwnProperty(name)) {
      this.disableState()
      delete this.state[name]
    }
  }

  /**
   *
   * Set the state map for this template
   *
   * @param {Object} map
   * @param {Object} map.events
   * @param {Object} map.attributes
   */
  setStateMap(map) {
    Object.keys(map).forEach((name) => {
      this.addState(name, map[name])
    })
  }
}

