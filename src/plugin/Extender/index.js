/**
 * @name Extender
 * @description 表格行拓展插件
 */

import { temp } from 'core/temps'
import { getType, checkPathByClass, renderElement, animateByHooks } from '@/utils'

import './style.scss'

export default class Extender {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { columns, state } = this.tableInstance

    const extensible = getType(options.extender) === 'object'

    if (extensible) {
      const { renderer, accordion, transition } = options.extender

      if (getType(renderer) === 'function') {
        state.extender = {
          extensible,
          renderer,
          transition: transition !== false,
          accordion: accordion === true
        }

        const extender = {
          name: '',
          className: 'it-extender-control',
          accessor: data => {
            const uuid = data._itId

            if (!uuid) {
              return ''
            }

            const arrow = this._createArrowIcon()

            arrow.classList.add('it-extender-switch')

            return arrow
          },
          resize: false,
          sort: false,
          edit: false,
          filter: false,
          defaultWidth: 32
        }

        const children = columns[0].children

        if (children && children.length) {
          const index = children.findIndex(item => item.className === 'it-extender-control')
          if (!~index) {
            children.unshift(extender)
          } else {
            children.splice(index, 1, extender)
          }
        } else {
          const index = columns.findIndex(item => item.className === 'it-extender-control')
          if (!~index) {
            columns.unshift(extender)
          } else {
            columns.splice(index, 1, extender)
          }
        }
      } else {
        state.extender = {
          extensible: false
        }
      }
    } else {
      state.extender = {
        extensible
      }
    }

    this.state = state.extender
  }

  // 实例化后可基于 FlexTable 的完整 state 进行处理
  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  // 判断插件是否该使用
  shouldUse () {
    return this.state.extensible
  }

  beforeRenderBody () {
    this._removeAllExtend()
  }

  beforeRenderData () {
    this._removeAllExtend()
  }

  create () {
    if (this.state.extensible) {
      this.tableInstance.registerMethod('extendRefresh', this._extendRefresh.bind(this), false)
      this.tableInstance.registerMethod('removeAllExtend', this._removeAllExtend.bind(this), false)
    }

    this.created = true
  }

  bindEvent () {
    const { table } = this.tableInstance
    const tbody = table.querySelector('.it-tbody')
    const clickEventName = this.tableInstance.constructor._clickEventName || 'click'

    tbody.addEventListener(clickEventName, event => {
      if (this.tableInstance._lock) {
        return false
      }

      const path = event.path

      let target = null

      if (path) {
        target = path.find(value => value.classList && value.classList.contains('it-extender-switch'))
      } else {
        target = event.target || event.srcElement
        target = checkPathByClass(target, 'it-extender-switch')
      }

      if (target) {
        const tr = checkPathByClass(target, 'it-tr')

        if (!tr) {
          return false
        }

        const rowId = tr.itRowId
        const trGroup = tr.parentNode

        if (!rowId || !trGroup) {
          return false
        }

        if (target.classList.contains('extend')) {
          const extendWrapper = trGroup.querySelector('.it-extend-wrapper')

          if (this.state.transition) {
            this._removeExtend(extendWrapper)
          } else {
            trGroup.removeChild(extendWrapper)
            this._scrollRefresh()
          }

          target.classList.remove('extend')
          trGroup.classList.remove('extend')
        } else {
          const { renderer, accordion, transition } = this.state
          const { data, dangerous } = this.tableInstance

          if (accordion) {
            this._removeAllExtend()
          }

          const rowData = data.find(item => item._itId === rowId)
          const result = renderer(rowData)

          const extendWrapper = temp.cloneNode()

          extendWrapper.className = 'it-extend-wrapper'

          renderElement(extendWrapper, result, dangerous)

          if (transition) {
            animateByHooks(extendWrapper, {
              before: el => {
                el.style.height = '0'
                el.style.overflow = 'hidden'
              },
              finish: el => {
                if (el.scrollHeight !== 0) {
                  el.style.height = `${el.scrollHeight}px`
                } else {
                  el.style.height = ''
                }
              },
              after: el => {
                el.style.height = ''
                el.style.overflow = ''
                this._scrollRefresh()
              }
            })

            trGroup.appendChild(extendWrapper)
          } else {
            trGroup.appendChild(extendWrapper)
            this._scrollRefresh()
          }

          target.classList.add('extend')
          trGroup.classList.add('extend')
        }
      }
    })
  }

  _extendRefresh () {
    const { table, data, dangerous } = this.tableInstance
    const tbody = table.querySelector('.it-tbody')

    const { renderer } = this.state

    const extendRows = tbody.querySelectorAll('.it-tr-group.extend')

    for (let i = 0, len = extendRows.length; i < len; i++) {
      const extendRow = extendRows[i]
      const tr = extendRow.querySelector('.it-tr')
      const wrapper = extendRow.querySelector('.it-extend-wrapper')

      const rowId = tr.itRowId

      if (!rowId) {
        continue
      }

      const rowData = data.find(item => item._itId === rowId)
      const result = renderer(rowData)

      wrapper.innerHTML = ''

      renderElement(wrapper, result, dangerous)
    }
  }

  _createArrowIcon (size = 18, color = 'black') {
    const wrapper = temp.cloneNode()

    wrapper.className = 'it-icon it-icon-arrow'
    wrapper.style.width = `${size}px`
    wrapper.style.height = `${size}px`

    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    arrow.setAttribute('viewBox', '0 0 125 125')

    const arrowTop = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')

    arrowTop.setAttribute('fill-rule', 'evenodd')
    arrowTop.setAttribute('clip-rule', 'evenodd')
    arrowTop.setAttribute('fill', color)

    const arrowBottom = arrowTop.cloneNode()

    arrowTop.setAttribute('points', '72.2,58.2 51,79.2 55.9,84 77,63')
    arrowBottom.setAttribute('points', '51,46.8 55.9,42 77,63 72.2,67.8')

    arrow.appendChild(arrowTop)
    arrow.appendChild(arrowBottom)
    arrow.style.width = `${size}px`
    arrow.style.height = `${size}px`

    wrapper.appendChild(arrow)

    return wrapper
  }

  _scrollRefresh () {
    if (getType(this.tableInstance.scrollRefresh) === 'function') {
      this.tableInstance.scrollRefresh()
    }
  }

  _removeExtend (wrapper) {
    if (!wrapper) {
      return false
    }

    animateByHooks(wrapper, {
      before: el => {
        el.style.height = `${el.scrollHeight}px`
        el.style.overflow = 'hidden'
      },
      finish: el => {
        if (el.scrollHeight !== 0) {
          el.style.height = '0'
        }
      },
      after: el => {
        el.parentNode.removeChild(el)
        this._scrollRefresh()
      }
    })
  }

  _removeAllExtend () {
    const { table } = this.tableInstance
    const tbody = table.querySelector('.it-tbody')

    const { transition } = this.state

    const extendRows = tbody.querySelectorAll('.it-tr-group.extend')

    for (let i = 0, len = extendRows.length; i < len; i++) {
      const extendRow = extendRows[i]
      const wrapper = extendRow.querySelector('.it-extend-wrapper')
      const control = extendRow.querySelector('.it-extender-switch')

      if (transition) {
        this._removeExtend(wrapper)
      } else {
        extendRow.removeChild(wrapper)
        this._scrollRefresh()
      }

      control.classList.remove('extend')
    }
  }
}
