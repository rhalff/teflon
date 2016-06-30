export default {
  'default': {
    attributes: [{ path: ':0', op: 'add', name: 'class', val: 'default-applied' }]
  },
  'move-up': {
    events: [{ path: 'button-up', op: 'add', name: 'click', val: 'MOVE.UP' }]
  },

  'move-down': {
    events: [{ path: 'button-down', op: 'add', name: 'click', val: 'MOVE.DOWN' }]
  },

  'disable-up': {
    attributes: [{ path: 'button-up', op: 'add', name: 'class', val: 'css-button-disabled' }],
    events: [{ path: 'button-up', op: 'remove', name: 'click' }]
  },

  'disable-down': {
    attributes: [{ path: 'button-down', op: 'add', name: 'class', val: 'css-button-disabled' }],
    events: [{ path: 'button-down', op: 'remove', name: 'click' }]
  }
  /*
  'dark-jedi-found': {
    ':': {
      'attributes': {
        'class': {
          'add': 'dark-jedi'
        }
      }
    }
  }
  */
}
