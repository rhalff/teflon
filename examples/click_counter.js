export default def

const def = {
  type: 'Teflon', // default definition format
  title: 'Basic Example with Click Counter',
  tag: 'Counter',
  template: '<h2>Click me! Number of clicks: <!-- click counter --></h2>',
  mapping: {
    'button': ':0',
    'counter': ':0:1'
  },
  states: {
    'default': {
      events: [
        { path: 'button', op: 'add', name: 'click', val: 'increase' }
      ]
    }
  },
  data: {
    'default': {
      'counter': 'count'
    }
  },
  /**
   *
   *  Default handlers
   *  Handlers defined within the component itself
   *  Will update the internal state.
   *
   *  Which means what you return will be the new data input.
   *
   *  Internally it does the same as:
   *
   *  teflon.on('<eventname', () => {})
   *
   *  Instead of going external, it feeds itself internally
   */
  handlers: {
    'increase': (ev, state) => {
      return {
        count: state.count++
      }
    }
  }
}
