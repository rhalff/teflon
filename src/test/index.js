import {} from 'babel/register'
import { expect, assert } from 'chai'
import Teflon from '../index'
import { createElement, click } from './util'
import JediHTML from './fixtures/jedi'
import stateMap from './fixtures/state'

describe('Teflon', () => {
  const templateMap = {
    'planet-monitor': ':0:0:0',
    'current-planet': ':0:0:0:1',
    'slot-1': ':0:0:1:0:0',
    'slot-2': ':0:0:1:0:1',
    'button-up': ':0:0:1:1:0',
    'button-down': ':0:0:1:1:1'
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

        expect(teflon.dp.getRef(':0:0:1:0:0:0').innerHTML).eql('Exar Kun')
        expect(teflon.dp.getRef(':0:0:1:0:0:1').innerHTML).eql('Coruscant')
        expect(teflon.dp.getRef('slot-1').innerHTML).eql('<h3>Exar Kun</h3><h6>Coruscant</h6>')

        teflon.link('setSlotTwo', 'data', mapTwo)
        teflon.fill('setSlotTwo', data)
        expect(teflon.dp.getRef('slot-2').innerHTML).eql('<h3>John Doe</h3><h6>Earth</h6>')
      })
    })
  })

  describe('Events', () => {
    it('Add event handler', () => {
      // should probably be converted to emit...
      teflon.addEventHandler('click', ':0:0:1:1:0', 'move-up')
      expect(teflon.handlers).to.haveOwnProperty('click')
      assert.isObject(teflon.handlers.click)
      assert.isArray(teflon.handlers.click[':0:0:1:1:0'])
      expect(teflon.handlers.click[':0:0:1:1:0'][0]).eql('move-up')
    })

    it('Remove event handler', () => {
      // should probably be converted to emit...
      teflon.removeEventHandler('click', ':0:0:1:1:0', 'move-up')
      expect(teflon.handlers).to.not.haveOwnProperty('click')
    })

    it('Re-add same event handler', () => {
      teflon.addEventHandler('click', 'button-up', 'move-up')
      expect(teflon.handlers).to.haveOwnProperty('click')
      expect(teflon.handlers.click[':0:0:1:1:0'][0]).eql('move-up')
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
      expect(teflon.handlers.click).to.include.keys(':0:0:1:1:0', ':0:0:1:1:1')
      expect(teflon.handlers.click[':0:0:1:1:1']).to.contain('move-down')

      teflon.render()

      const handler = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:0:1:1:1')
        done()
      }

      teflon.on('move-down', handler)

      click(teflon.dp.refs.get('button-down'))

      teflon.off('move-down', handler)
      expect(teflon.listeners('move-down').length).to.eql(0)
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
          .to.eql(':0:0:1:1:0')
        done()
      }
      teflon.activateState('move-up')
      teflon.on('MOVE.UP', handle)
      click(teflon.dp.getRef('button-up'))
      teflon.off('MOVE.UP', handle)
    })
    it('Move down', (done) => {
      const handle = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:0:1:1:1')
        done()
      }
      teflon.activateState('move-down')
      teflon.on('MOVE.DOWN', handle)
      click(teflon.dp.getRef('button-down'))
      teflon.off('MOVE.DOWN', handle)
    })
    it('move-up state still active', (done) => {
      const handle = (ev) => {
        expect(teflon.dp.path(ev.srcElement))
          .to.eql(':0:0:1:1:0')
        done()
      }
      expect(teflon.listeners('MOVE.UP').length).to.eql(0)
      expect(teflon.listeners('MOVE.DOWN').length).to.eql(0)
      teflon.on('MOVE.UP', handle)
      click(teflon.dp.getRef('button-up'))
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
  })
})
