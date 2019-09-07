/**
 * @name Resizer
 * @description 调整表格大小插件
 */

import { temp } from 'core/temps'
import { addEventWhiteList, dispatchEvent } from 'core/events'
import { getType } from '@/utils'

import './style.scss'

export default class Resizer {
  constructor (tableInstance, options) {
    this.tableInstance = tableInstance
    this.defaultColumnWidth = this.tableInstance.constructor.defaultColumnWidth
    this._clickEventName = this.tableInstance.constructor._clickEventName

    const { state } = this.tableInstance

    let resizable = getType(options.resizer) === 'object'

    if (this._clickEventName === 'touchstart') {
      resizable = false
    }

    if (resizable) {
      const { force } = options.resizer

      state.resizer = {
        resizable,
        columnWidth: new Proxy({}, this._getProxyHandler()),
        force: force === true,
        resizing: false
      }

      addEventWhiteList.apply(this.tableInstance, ['columnResize'])
    } else {
      state.resizer = {
        resizable
      }
    }

    this.state = state.resizer
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.resizable
  }

  create () {
    const { table, columnProps } = this.tableInstance
    const { columnWidth } = this.state

    const thead = table.querySelector('.it-thead.shadow')
    thead.classList.add('resize')

    const ths = thead.querySelectorAll('.it-thead.shadow .it-th')

    for (let i = 0, len = ths.length; i < len; i++) {
      const th = ths[i]
      const id = th.itColumnId

      if (!id) {
        return false
      }

      const props = columnProps.find(value => value.id === id)

      if (props.resize !== false) {
        const resizer = temp.cloneNode()
        resizer.className = 'it-resizer'
        resizer.itColumnIndex = i
        th.classList.add('it-resize')
        th.appendChild(resizer)
        th.itResize = false
      } else {
        columnWidth[i.toString()] = 0
      }

      columnWidth[i.toString()] = parseInt(th.style.width) || this.defaultColumnWidth
    }

    this.refresh()
    this.created = true
  }

  bindEvent () {
    const table = this.tableInstance.table

    let mouseDown = 'mousedown'
    let mouseMove = 'mousemove'
    let mouseUp = 'mouseup'

    if (this._clickEventName === 'touchstart') {
      mouseDown = 'touchstart'
      mouseMove = 'touchmove'
      mouseUp = 'touchend'
    }

    const handler = temp.cloneNode()
    handler.className = 'it-resize-handler'

    let index = 0
    let start = 0
    let end = 0

    const handlerMove = evt => {
      evt.stopPropagation()

      const tableRect = table.getBoundingClientRect()

      end = evt.clientX - tableRect.left
      handler.style.left = `${end}px`

      return false
    }

    const resizeFinish = evt => {
      evt.stopPropagation()

      const column = table.querySelectorAll('.it-thead.shadow .it-th')[index]
      const columnRect = column.getBoundingClientRect()

      const currentWidth = columnRect.width
      const targetWidth = (currentWidth + end - start)

      this.state.columnWidth[index.toString()] = parseInt(targetWidth)
      table.removeChild(handler)
      start = 0
      end = 0

      document.removeEventListener(mouseMove, handlerMove)
      document.removeEventListener(mouseUp, resizeFinish)

      // 延迟100ms保证防止触发排序器
      setTimeout(() => {
        this.state.resizing = false
        this.tableInstance._lock = false
      }, 200)

      return false
    }

    table.addEventListener(mouseDown, evt => {
      const target = evt.target || evt.srcElement

      if (target.classList.contains('it-resizer')) {
        evt.stopPropagation()

        this.state.resizing = true
        this.tableInstance._lock = true
        index = target.itColumnIndex

        const tableRect = table.getBoundingClientRect()
        const resizerRect = target.getBoundingClientRect()

        start = resizerRect.left - tableRect.left + 13
        end = start

        handler.style.left = `${start}px`
        table.appendChild(handler)

        document.addEventListener(mouseMove, handlerMove)
        document.addEventListener(mouseUp, resizeFinish)
      }

      return false
    })
  }

  afterRender () {
    if (this.created && this.state.force) {
      this.refresh()
    }
  }

  refresh () {
    const { table } = this.tableInstance
    const { columnWidth } = this.state
    const ths = table.querySelectorAll('.it-thead.shadow .it-th')

    for (let i = 0, len = ths.length; i < len; i++) {
      const th = ths[i]
      const { width } = th.getBoundingClientRect()

      if (width) {
        columnWidth[i.toString()] = 0
        columnWidth[i.toString()] = parseInt(width)
      }
    }
  }

  // 控制列宽代理控制器
  _getProxyHandler () {
    const _this = this
    return {
      set (obj, prop, value) {
        const old = obj[prop]

        if (typeof old !== 'undefined' && old !== value) {
          obj[prop] = value
          _this._renderResize(parseInt(prop))
          dispatchEvent.apply(_this.tableInstance, ['columnResize', { index: parseInt(prop), oldWidth: old, newWidth: value }])
        } else {
          obj[prop] = value
        }

        return true
      }
    }
  }

  _renderResize (index) {
    const { table, columnProps } = this.tableInstance
    const nthOfType = index + 1
    const columnWidth = this.state.columnWidth
    const targetWidth = columnWidth[index]
    const props = columnProps[index]
    props.width = targetWidth

    const theads = table.querySelectorAll('.it-thead, .it-tbody-group, .it-tfoot')
    const childThs = table.querySelectorAll(`.it-thead.resize .it-th:nth-of-type(${nthOfType})`)
    const tbodyTds = table.querySelectorAll(`
      .it-tbody .it-tr>.it-td:nth-of-type(${nthOfType}),
      .it-tfoot .it-tr>.it-td:nth-of-type(${nthOfType})
    `)
    const groupTh = props.parentTarget

    let tableWidth = 0

    for (const key in columnWidth) {
      const width = columnWidth[key]
      tableWidth += width
    }

    for (let i = 0, len = theads.length; i < len; i++) {
      const thead = theads[i]
      thead.style.minWidth = `${tableWidth}px`
    }

    table.style.minWidth = `${tableWidth}px`

    // 用于保持两层表头结构 (flex布局) 一致性
    if (!childThs[0].itResize) {
      childThs[0].itResize = true

      if (groupTh) {
        groupTh.itChildrenSize--
      }
    }

    if (groupTh) {
      const { itChildrenIds, itChildrenSize } = groupTh
      let width = 0

      for (const id of itChildrenIds) {
        width += columnProps.find(props => props.id === id).width
      }

      groupTh.style.cssText = `flex: ${itChildrenSize * 100} 0 auto; width: ${width}px`
    }

    for (let i = 0, len = childThs.length; i < len; i++) {
      childThs[i].style.cssText = `flex: ${targetWidth} 0 auto; width: ${targetWidth}px; max-width: ${targetWidth}px`
    }

    for (let i = 0, len = tbodyTds.length; i < len; i++) {
      const td = tbodyTds[i]
      td.style.cssText = `flex: ${targetWidth} 0 auto; width: ${targetWidth}px; max-width: ${targetWidth}px`
    }
  }
}
