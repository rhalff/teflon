export default def

const def = {
  type: 'Teflon', // default definition format
  title: 'Basic Example with Click Counter',
  tag: 'Counter'
  template: '<h2>Click me! Number of clicks: <!-- click counter --></h2>',
  mapping: {
    'button': ':0',
    'counter': ':0:1'
  },
  states: {
    'default': {
      events: [
      /**
       *
       * I still dislike the format, but it does not have to be a final format.
       * This can be the low level format.
       *
       * I also do not like how the event name 'increase' is not specified further.
       * It's just a string, I would like it to be described.
       */
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

/*
Teflon.load(def, document.getElementById('message'))
  // initial data
  .data({count: 0})

  // the callback logic can be plugged
  // and chosen, each plugin has access to the event and the state
  // state is just the data going in. Which means state is exactly the input data.
  // not however that state can be a combination of data feeds.
  // which means increase can also receive the rest of the data of the template
  // anyway that's why the callback must be by custom factories.
  // just make a default good one, and make it possible to try different concepts.
  // anyway, ofcourse it could also be done by .on('increase', myFunc())
  .on('increase', (ev, state) => {
    return {
      count: state.count++
    }
  })
  // not to have a full component we could specify the logic of increase within the definition.
*/

/*
<div id="message" align="center"></div>

<script type="text/babel">
var Counter = React.createClass({
  getInitialState: function () {
    return { clickCount: 0 }
  },
  handleClick: function () {
    this.setState(function(state) {
      return {clickCount: state.clickCount + 1}
    })
  },
  render: function () {
    return (<h2 onClick={this.handleClick}>Click me! Number of clicks: {this.state.clickCount}</h2>)
  }
})
ReactDOM.render(
  <Counter />,
  document.getElementById('message')
)
</script>
*/