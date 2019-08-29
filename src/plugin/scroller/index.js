/**
 * @name Scroller
 * @description 表格滚动条
 */

import BScroll from '@better-scroll/core'
import MouseWheel from '@better-scroll/mouse-wheel'
import { getType } from '@/utils'

import './style.scss'

export default class Scroller {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const scrollable = getType(options.scroller) === 'object'

    if (scrollable) {
      const { height, mouse, wheel, wheelDistance } = options.scroller

      state.scroller = {
        scrollable,
        height: height || 300,
        mouse: mouse !== false,
        wheel: wheel === true,
        wheelDistance: wheelDistance || 20,
        scrolling: false
      }
    } else {
      state.scroller = {
        scrollable
      }
    }

    this.state = state.scroller
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.scrollable
  }

  create () {
    const { table } = this.tableInstance
    const { height, wheel, mouse, wheelDistance } = this.state

    const scroller = table.querySelector('.it-tbody-group')
    const tbody = scroller.querySelector('.it-tbody')

    scroller.style.height = `${height}px`
    tbody.style.position = 'absolute'
    tbody.style.overflow = 'hidden'

    const options = {}

    if (wheel) {
      BScroll.use(MouseWheel)

      options.mouseWheel = {
        speed: wheelDistance,
        invert: false,
        easeTime: 300
      }
    }

    if (!mouse) {
      options.click = false
      options.disableMouse = true
    }

    this._scroll = new BScroll(scroller, options)

    this.created = true
    this.scroll = true
  }

  afterRender () {
    this._scroll && this._scroll.refresh()
  }

  afterRenderBody () {
    this._scroll && this._scroll.refresh()
  }
}
