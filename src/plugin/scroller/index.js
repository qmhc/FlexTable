/**
 * @name Scroller
 * @description 表格滚动条
 */

import BScroll from '@better-scroll/core'
import MouseWheel from '@better-scroll/mouse-wheel'
import Pullup from '@better-scroll/pull-up'
import { getType } from '@/utils'
import { temp, spanTemp } from 'core/temps'

import './style.scss'

// TODO: 更多 better-scroll 的 api 代理
export default class Scroller {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const able = getType(options.scroller) === 'object'

    if (able) {
      const { height, mouse, wheel, wheelDistance, pullup, pullupThreshold, pullupTip } = options.scroller

      state.scroller = {
        able,
        height: height || 300,
        mouse: mouse !== false,
        wheel: wheel === true,
        wheelDistance: wheelDistance || 20,
        pullup,
        pullupThreshold,
        pullupTip,
        scrolling: false
      }
    } else {
      state.scroller = {
        able
      }
    }

    this.state = state.scroller
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.able
  }

  create () {
    const { table } = this.tableInstance
    const { height, wheel, mouse, wheelDistance, pullup, pullupThreshold, pullupTip } = this.state

    const scroller = table.querySelector('.it-tbody-group')
    const tbody = scroller.querySelector('.it-tbody')

    scroller.style.height = `${height}px`
    tbody.style.position = 'absolute'
    tbody.style.overflow = 'visible'

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

    if (getType(pullup) === 'function') {
      BScroll.use(Pullup)

      const wrapper = temp.cloneNode()
      wrapper.classList.add('pullup-wrapper')

      const tip = spanTemp.cloneNode()
      tip.textContent = pullupTip || 'Loading...'

      wrapper.appendChild(tip)
      tbody.appendChild(wrapper)

      this.pullupWrapper = wrapper

      options.pullUpLoad = {
        threshold: parseInt(pullupThreshold) || 10
      }
    }

    this._scroll = new BScroll(scroller, options)

    this._scroll.on('scrollStart', () => {
      this.tableInstance._lock(this)
    })

    this._scroll.on('scrollCancel', () => {
      this.tableInstance._unlock(this)
    })

    this._scroll.on('scrollEnd', () => {
      this.tableInstance._unlock(this)
    })

    if (getType(pullup) === 'function') {
      this._scroll.on('pullingUp', () => {
        pullup(this.tableInstance, this.finishPullup.bind(this))
      })
    }

    this.tableInstance.registerMethod('scrollTo', this.scrollTo.bind(this), false)
    this.tableInstance.registerMethod('scrollRefresh', this.refresh.bind(this), false)

    this.created = true
  }

  afterRender () {
    this.refresh()
  }

  afterRenderBody () {
    this.refresh()
  }

  refresh () {
    this._scroll && this._scroll.refresh()
  }

  scrollTo (x, y) {
    this._scroll && this._scroll.scrollTo(x, y)
  }

  finishPullup (refresh) {
    if (this._scroll) {
      const { table } = this.tableInstance
      const tbody = table.querySelector('.it-tbody')

      this._scroll.finishPullUp()

      if (refresh === true) {
        this.tableInstance.refresh({
          data: true,
          struct: true,
          callback: () => {
            this._scroll.refresh()
            tbody.appendChild(this.pullupWrapper)
          }
        })
      } else {
        this._scroll.refresh()
        tbody.appendChild(this.pullupWrapper)
      }
    }
  }
}
