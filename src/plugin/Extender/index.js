/* eslint-disable */
/**
 * @name Extender
 * @description 表格行拓展插件
 */

import { temp } from 'core/temps'
import { getType, checkPathByClass, renderElement } from '@/utils'

import './style.scss'

const raf = window.requestAnimationFrame

export default class Extender {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { columns, state } = this.tableInstance

    const extensible = getType(options.extender) === 'object'

    if (extensible) {
      const { accessor, accordion, transition } = options.extender

      if (getType(accessor) === 'function') {
        state.extender = {
          extensible,
          accessor,
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

            const arrow = this._createArrow()

            arrow.classList.add('it-extender-switch')

            return arrow
          },
          resizable: false,
          sortable: false,
          editable: false,
          filterable: false,
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

  // 根据表格行数进行处理, 并返回新行数
  beforeRenderBody (count) {
    return count
  }

  // 根据表格数据进行处理, 并返回新数据
  beforeRenderData (data) {
    return data
  }

  beforeCreate () {}

  create () {
    // create code
    this.created = true
  }

  bindEvent () {
    const { table } = this.tableInstance
    const tbody = table.querySelector('.it-tbody')

    tbody.addEventListener('click', event => {
      let { target } = event

      target = checkPathByClass(target, 'it-extender-switch')

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
        } else {
          const { accessor, accordion, transition } = this.state
          const { data, dangerous } = this.tableInstance

          if (accordion) {
            const _extends = tbody.querySelectorAll('.it-extend-wrapper')
            const controls = tbody.querySelectorAll('.it-extender-switch.extend')

            for (let i = 0, len = _extends.length; i < len; i++) {
              if (transition) {
                this._removeExtend(_extends[i])
              } else {
                _extends[i].parentNode.removeChild(_extends[i])
                this._scrollRefresh()
              }
              
              controls[i].classList.remove('extend')
            }
          }

          const rowData = data.find(item => item._itId === rowId)
          const result = accessor(rowData)

          const extendWrapper = temp.cloneNode()

          extendWrapper.className = 'it-extend-wrapper'

          renderElement(extendWrapper, result, dangerous)

          if (transition) {
            extendWrapper.style.height = '0'
            extendWrapper.style.overflow = 'hidden'

            raf(() => {
              if (extendWrapper.scrollHeight !== 0) {
                extendWrapper.style.height = `${extendWrapper.scrollHeight}px`
              } else {
                extendWrapper.style.height = ''
              }
            })

            const transitionEnd = () => {
              this._scrollRefresh()
              extendWrapper.removeEventListener('transitionend', transitionEnd)
              extendWrapper.style.height = ''
              extendWrapper.style.overflow = ''
            }

            extendWrapper.addEventListener('transitionend', transitionEnd)

            trGroup.appendChild(extendWrapper)
          } else {
            trGroup.appendChild(extendWrapper)
            this._scrollRefresh()
          }

          target.classList.add('extend')
        }
      }
    })
  }

  afterCreate () {
    if (this.created) {}
  }

  // 根据表格行数进行处理
  afterRenderBody (count) {
    if (this.created) {}
  }

  // 根据表格数据进行处理
  afterRenderData (data) {
    if (this.created) {}
  }

  _createArrow (size = 18, color = 'black') {
    const wrapper = temp.cloneNode()

    wrapper.className = 'it-arrow'
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

    wrapper.style.height = `${wrapper.scrollHeight}px`
    wrapper.style.overflow = 'hidden'

    raf(() => {
      if (wrapper.scrollHeight !== 0) {
        wrapper.style.height = '0'
      }
    })

    wrapper.addEventListener('transitionend', () => {
      wrapper.parentNode.removeChild(wrapper)
      this._scrollRefresh()
    })
  }
}
