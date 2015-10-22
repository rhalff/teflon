import {} from 'babel/register'
import { expect } from 'chai'
import Teflon from '../index'
import { createElement } from './util'

describe('Teflon', () => {
  const html = `
    <div>
      <div>
        <h1 title="Heading" class="heading"></h1>
        <h3 class="sub title"></h3>
      </div>
    </div>`
  const targetEl = document.getElementById('target')

  it('create()', () => {
    Teflon.create(createElement(html))
  })

})
