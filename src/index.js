import DomPointer from 'dompointer'
import { EventEmitter } from 'events'

export default class Teflon extends EventEmitter {

    constructor(dp) {
      super()
      this.dp = dp
    }

    static create(el) {
      const dp = DomPointer.create(el)
      return new Teflon(dp)
    }

}