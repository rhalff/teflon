import { insertAfter } from '../util'
import Dot from 'dot-object'

export default class Repeat {

  getInsertionRow (rowTpl, container, path) {
    let baseRow
    // if the path exist set it as first row and set the index
    if (this.dp.refs.has(path)) {
      baseRow = this.dp.refs.get(path)
    } else {
      baseRow = rowTpl.cloneNode(true)
      if (container.childNodes.length > 0) {
        const pos = path.split(':').pop()
        insertAfter(baseRow, container.childNodes[pos - 1])
      } else {
        container.appendChild(baseRow)
      }
      this.dp.updateRef(path, baseRow)
    }
    baseRow.dataset.teflonIndex = 0
    baseRow.dataset.teflonOwner = path
    return baseRow
  }

  /**
   *
   * Creates the rows
   *
   * Takes the row template from dp.template
   *
   * And applies it zero or many times
   *
   * @param {String} base The base path
   * @param {String} path The path of the referenced row
   * @param {Number} rowCount Number of rows to create
   * @returns {Undefined} Undefined
   */
  createRows (base, path, rowCount) {
    let firstRow

    const container = this.dp.getRef(base.join(':'))
    const rowTpl = this.dp.template.getRef(path)

    if (rowCount > 0) {
      firstRow = this.getInsertionRow(rowTpl, container, path)
    }

    const nodes = container.querySelectorAll('[data-teflon-owner="' + path + '"]')
    let oldCount = nodes ? nodes.length : 0

    if (oldCount < rowCount) {
      let node = firstRow
      for (let idx = oldCount; idx < rowCount; idx++) {
        node = insertAfter(rowTpl.cloneNode(true), node)
        node.dataset.teflonIndex = idx
        node.dataset.teflonOwner = path
      }
    } else if (oldCount > rowCount) {
      while (oldCount > rowCount) {
        container.removeChild(nodes[--oldCount])
      }
    } else {
      // first has no owner info
      if (this.dp.refs.has(path)) {
        container.removeChild(this.dp.refs.get(path))
      }
    }

    this.dp.parse()

    // register the parent node for update
    this.dp.change.add(base.join(':'))
  }

  /**
   *
   * Repeat the data rows (variant 1)
   *
   * Example items format:
   * ```JSON
   * 'header': {    /---- relative template path
   *   ':0': 'name',
   *   ':1': 'homeworld.name'  <--- dot notation data path
   * }
   * ```
   *
   * This still goes only one level deep.
   *
   * @param {Object} pdef Object placement definition
   * @param {Array} data The data to be placed
   * @param {String} cpath The parent path, this def is relative to
   * @param {Boolean} append Whether to append the data
   * @returns {Undefined} Undefined
   */
  repeat (pdef, data, cpath, append) {
    if (!Array.isArray(data)) {
      throw Error('Items must be an array')
    }

    const path = this.dp.dealias(cpath)
    const base = path.split(':')
    const start = base.pop()

    this.createRows(base, path, data.length)
    this.fillRows(base, pdef, data, start, append)
  }

  fillRows (base, def, data, start, append) {
    const paths = Object.keys(def)
    let pos = start
    for (let idx = 0; idx < data.length; idx++) {
      const cpath = base.concat(pos++).join(':')
      for (const path of paths) {
        this.dp.data(path, Dot.pick(def[path], data[idx]), cpath, append)
      }
    }
  }
}

