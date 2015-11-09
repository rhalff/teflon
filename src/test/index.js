import {} from 'babel/register'
import { expect, assert } from 'chai'
import Teflon from '../index'
import State from '../state'
import { createElement, click } from './util'
import JediHTML from './fixtures/jedi'
import stateMap from './fixtures/state'

describe('Teflon', () => {
  const templateMap = {
    'planet-monitor': ':0:0',
    'current-planet': ':0:0:1',
    'slot-1': ':0:1:0:0',
    'slot-2': ':0:1:0:1',
    'button-up': ':0:1:1:0',
    'button-down': ':0:1:1:1'
  }

  const teflon = Teflon.create(createElement(JediHTML))

  describe('maps', () => {
    it('Set template map', () => {
      teflon.setTemplateMap(templateMap)
      Object.keys(templateMap).forEach((key) => {
        expect(teflon.dp.getRef(key))
          .eql(teflon.dp.getRef(templateMap[key]))
      })
    })

    describe('Data Map', () => {
      it('Simple placement', () => {
        const data = { id: 1, name: 'Earth' }
        const map = { 'current-planet': 'name' }

        teflon.link('setMonitor', 'data', map)
        teflon.fill('setMonitor', data)

        expect(teflon.dp.getRef('current-planet').nodeValue).eql('Earth')
        expect(teflon.dp.getRef('planet-monitor').innerHTML).eql('Obi-Wan currently on Earth')
      })

      it('Nested placement', () => {
        const data = {
          test: [
            {id: 2941, name: 'Exar Kun', homeworld: {id: 58, name: 'Coruscant'}},
            {id: 2942, name: 'John Doe', homeworld: {id: 59, name: 'Earth'}}
          ]
        }

        const mapOne = {
          'slot-1': {
            ':0': 'test[0].name',
            ':1': 'test[0].homeworld.name'
          }
        }

        const mapTwo = {
          'slot-2': {
            ':0': 'test[1].name',
            ':1': 'test[1].homeworld.name'
          }
        }

        teflon.link('setSlotOne', 'data', mapOne)
        teflon.fill('setSlotOne', data)

        expect(teflon.dp.getRef(':0:1:0:0:0').innerHTML).eql('Exar Kun')
        expect(teflon.dp.getRef(':0:1:0:0:1').innerHTML).eql('Coruscant')
        expect(teflon.dp.getRef('slot-1').innerHTML).eql('<h3>Exar Kun</h3><h6>Coruscant</h6>')

        teflon.link('setSlotTwo', 'data', mapTwo)
        teflon.fill('setSlotTwo', data)
        expect(teflon.dp.getRef('slot-2').innerHTML).eql('<h3>John Doe</h3><h6>Earth</h6>')
      })

      // data is the same
      const data = {
        test: [
          {id: 2941, name: 'Second', homeworld: {id: 58, name: 'Second World'}},
          {id: 2942, name: 'Third', homeworld: {id: 59, name: 'Third World'}}
        ]
      }

      it('Repeat array', () => {
        // repeat second slot

        const map = {
          // take slot 2
          'slot-2': {
            // use data path test which is an array
            path: 'test',
            // define how data must be placed
            items: {
              // path is relative to slot-2
              // if desired these could also be aliases
              // in which case they are just absolute pointers
              ':0': 'name',
              ':1': 'homeworld.name'
            }
          }
        }

        teflon.link('repeatSlot2', 'data', map)
        teflon.fill('repeatSlot2', data)
        // slot-2 itself is filled with first item
        expect(teflon.dp.getRef('slot-2').innerHTML).eql('<h3>Second</h3><h6>Second World</h6>')
        expect(teflon.dp.getRef('slot-2').nextSibling.innerHTML).eql('<h3>Third</h3><h6>Third World</h6>')

        // should survive render
        teflon.render()

        expect(teflon.dp.getRef('slot-2').innerHTML).eql('<h3>Second</h3><h6>Second World</h6>')
        expect(teflon.dp.getRef('slot-2').nextSibling.innerHTML).eql('<h3>Third</h3><h6>Third World</h6>')
      })

      it('re-applied but only one record, should update', () => {
        data.test.pop()
        teflon.fill('repeatSlot2', data)
        teflon.render()
        expect(teflon.dp.getRef('slot-2').innerHTML).eql('<h3>Second</h3><h6>Second World</h6>')
        expect(teflon.dp.getRef('slot-2').nextSibling).eql(null)
      })

      it('re-applied push 3, total of 4 items, should update', () => {
        // 4
        data.test.push({ name: 'Fourth', homeworld: {name: 'Fourth World'}})
        data.test.push({ name: 'Fifth', homeworld: {name: 'Fifth World'}})
        data.test.push({ name: 'Sixth', homeworld: {name: 'Sixth World'}})

        teflon.fill('repeatSlot2', data)
        expect(teflon.dp.getRef('slot-2')
          .innerHTML
        ).eql('<h3>Second</h3><h6>Second World</h6>')

        expect(teflon.dp.getRef('slot-2')
          .nextSibling.innerHTML
        ).eql('<h3>Fourth</h3><h6>Fourth World</h6>')

        expect(teflon.dp.getRef('slot-2')
          .nextSibling.innerHTML
        ).eql('<h3>Fourth</h3><h6>Fourth World</h6>')

        expect(teflon.dp.getRef('slot-2')
          .nextSibling.nextSibling.innerHTML
        ).eql('<h3>Fifth</h3><h6>Fifth World</h6>')

        expect(teflon.dp.getRef('slot-2')
          .nextSibling.nextSibling.nextSibling.innerHTML
        ).eql('<h3>Sixth</h3><h6>Sixth World</h6>')
      })
    })
  })

  describe('Events', () => {
    it('Add event handler', () => {
      // should probably be converted to emit...
      teflon.addEventHandler('click', ':0:1:1:0', 'move-up')
      expect(teflon.handlers).to.haveOwnProperty('click')
      assert.isObject(teflon.handlers.click)
      assert.isArray(teflon.handlers.click[':0:1:1:0'])
      expect(teflon.handlers.click[':0:1:1:0'][0]).eql('move-up')
    })

    it('Remove event handler', () => {
      // should probably be converted to emit...
      teflon.removeEventHandler('click', ':0:1:1:0', 'move-up')
      expect(teflon.handlers).to.not.haveOwnProperty('click')
    })

    it('Re-add same event handler', () => {
      teflon.addEventHandler('click', 'button-up', 'move-up')
      expect(teflon.handlers).to.haveOwnProperty('click')
      expect(teflon.handlers.click[':0:1:1:0'][0]).eql('move-up')
    })

    it('Adding duplication action should fail', () => {
      expect(() => {
        teflon.addEventHandler('click', 'button-up', 'move-up')
      }).to.throw(Error)
    })
    it('Use event handler', (done) => {
      const target = document.createElement('div')
      document.body.appendChild(target)
      teflon.setElement(target)
      teflon.addEventHandler('click', 'button-down', 'move-down')

      expect(teflon.handlers).property('click')
      expect(teflon.handlers.click).to.include.keys(':0:1:1:0', ':0:1:1:1')
      expect(teflon.handlers.click[':0:1:1:1']).to.contain('move-down')

      teflon.render()

      const handler = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:1:1:1')
        done()
      }

      teflon.on('move-down', handler)

      click(teflon.dp.dom.refs.get('button-down'))

      teflon.off('move-down', handler)
      expect(teflon.callbacks).not.have.ownProperty('move-down')
    })
    it('Remove all handlers', () => {
      teflon.removeEventHandlers()
      expect(Object.keys(teflon.handlers).length).to.eql(0)
    })
  })

  describe('States', () => {
    it('setStateMap()', () => {
      teflon.setStateMap(stateMap)
    })
    it('Move up', (done) => {
      const handle = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:1:1:0')
        done()
      }
      teflon.activateState('move-up')
      teflon.on('MOVE.UP', handle)
      click(teflon.dp.dom.getRef('button-up'))
      teflon.off('MOVE.UP', handle)
    })

    describe('getState()', () => {
      it('should get existing state', () => {
        expect(teflon.getState('move-up')).to.be.instanceOf(State)
      })
      it('should throw if state does not exist', () => {
        expect(() => teflon.getState('no-exist')).to.throw(/not exist/)
      })
    })

    it('hasState()', () => {
      expect(teflon.hasState('move-up')).to.eql(true)
      expect(teflon.hasState('move-down')).to.eql(true)
      expect(teflon.hasState('move-err')).to.eql(false)
    })

    it('inState()', () => {
      expect(teflon.inState('move-up')).to.eql(true)
      expect(teflon.inState('move-down')).to.eql(false)
      expect(() => teflon.inState('move-err')).to.throw(/does not exist/)
    })

    it('Cannot activate an active state', () => {
      expect(() => teflon.activateState('move-up')).to.throw(/already activated/)
    })

    it('Cannot disable a disabled state', () => {
      expect(() => teflon.disableState('move-down')).to.throw(/already disabled/)
    })

    it('Move down', (done) => {
      const handle = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:1:1:1')
        done()
      }
      teflon.activateState('move-down')
      teflon.on('MOVE.DOWN', handle)
      click(teflon.dp.dom.getRef('button-down'))
      teflon.off('MOVE.DOWN', handle)
    })
    it('move-up state still active', (done) => {
      const handle = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:1:1:0')
        done()
      }
      expect(teflon.callbacks).not.have.ownProperty('MOVE.UP')
      expect(teflon.callbacks).not.have.ownProperty('MOVE.DOWN')
      teflon.on('MOVE.UP', handle)
      click(teflon.dp.dom.getRef('button-up'))
      teflon.off('MOVE.UP', handle)
    })
    it('disable move-down state', () => {
      teflon.disableState('move-down')
    })
    it('disable move-up state', () => {
      teflon.disableState('move-up')
    })
    it('activateState with attributes', () => {
      teflon.activateState('disable-up')
      const el = teflon.dp.getRef('button-up')
      expect(el.getAttribute('class')).to.eql('css-button-up css-button-disabled')
    })
    it('disableState with attributes', () => {
      teflon.disableState('disable-up')
      const el = teflon.dp.getRef('button-up')
      expect(el.getAttribute('class')).to.eql('css-button-up')
    })
    it('default state should be automatically activated', () => {
      expect(teflon.hasState('default')).to.eql(true)
      expect(teflon.inState('default')).to.eql(true)
    })
  })
})
