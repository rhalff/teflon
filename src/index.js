import DomPointer from 'dompointer'
import Dot from 'dot-object'
import { mixin } from './util'
import Repeat from './data/repeat'
import States from './states'
import Events from './events'
import merge from 'lodash.merge'

export default class Teflon {
  constructor(dp) {
    this.dp = dp
    this.handlers = new Map
    this.state = new Map()
    this._prototype = {}
    this.input = {}

    this.maps = {
      data: new Map()
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
    this.maps[type].set(name, map)
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

    if (!this.maps.data.has(name)) {
      throw Error('No such data map: ' + name)
    }
    const map = this.maps.data.get(name)
    this._fill(map, data, append)
    return this
  }

  _fill(map, data, append, ptpath) {
    Object.keys(map).forEach((tpath) => {
      const dpath = map[tpath]
      if (dpath.constructor.name === 'Object') {
        if (dpath.hasOwnProperty('path')) {
          const val = Dot.pick(dpath.path, data)
          if (dpath.hasOwnProperty('items')) {
            if (!Array.isArray(val)) {
              throw Error(
                `items defined but picked data is not an array while trying to fill ${tpath} with ${dpath.path}`
              )
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
    })
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
}

mixin(Teflon, Events)
mixin(Teflon, Repeat)
mixin(Teflon, States)
