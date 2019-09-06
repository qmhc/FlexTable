/**
 * @name Selector
 * @description 表格数据选择 (复选框)
 */

import { addEventWhiteList, dispatchEvent } from 'core/events'
import { getType, createCheckbox } from '@/utils'

import './style.scss'

function getSelectedDataList () {
  const selectedDataList = []
  for (const id of this.selection) {
    const data = { ...this.recorder[id].rowData }
    selectedDataList.push(data)
  }
  return selectedDataList
}

// TODO: 添加点击行选取的模式
export default class Selector {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const selectable = getType(options.selector) === 'object'

    if (selectable) {
      const { columns } = this.tableInstance

      this.selection = []
      this.recorder = {}

      const headCheck = createCheckbox()

      const selector = {
        name: headCheck,
        className: 'it-selector-control',
        accessor: data => {
          const uuid = data._itId

          if (!uuid) {
            return ''
          }

          let rowCheck = null

          if (this.recorder[uuid]) {
            rowCheck = this.recorder[uuid].target
          } else {
            rowCheck = createCheckbox()

            this.recorder[uuid] = {
              target: rowCheck,
              rowData: data
            }

            rowCheck.addEventListener('change', event => {
              event.stopPropagation()

              let type = 'select'

              if (rowCheck.checked) {
                this.selection.push(uuid)
              } else {
                const index = this.selection.findIndex(item => item === uuid)

                if (~index) {
                  this.selection.splice(index, 1)
                }

                type = 'cancel'
              }

              dispatchEvent.apply(this.tableInstance, ['selectChange', { type, id: uuid, data: { ...data }, selection: [...this.selection] }])
            })

            // 问题仅存在移动端使用 touchstart 事件
            // 冒泡后会导致被 better-scroll 拦截从而无法触发内部 input 的 change 事件, 原因不明
            // 阻止冒泡会导致以 checkbox 为触点则无法触发 better-scroll 的滚动
            const clickEventName = this.tableInstance.constructor._clickEventName

            rowCheck.addEventListener(clickEventName, event => {
              event.stopPropagation()
            })

            rowCheck._itId = uuid
          }

          return rowCheck
        },
        resize: false,
        sort: false,
        edit: false,
        filter: false,
        defaultWidth: 32
      }

      const children = columns[0].children

      if (children && children.length) {
        const index = children.findIndex(item => item.className === 'it-selector-control')
        if (!~index) {
          children.unshift(selector)
        } else {
          children.splice(index, 1, selector)
        }
      } else {
        const index = columns.findIndex(item => item.className === 'it-selector-control')
        if (!~index) {
          columns.unshift(selector)
        } else {
          columns.splice(index, 1, selector)
        }
      }

      state.selector = {
        selectable
      }

      addEventWhiteList.apply(this.tableInstance, ['selectChange'])
    } else {
      state.selector = {
        selectable
      }
    }

    this.state = state.selector
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.selectable
  }

  create () {
    if (this.state.selectable) {
      this.tableInstance.registerMethod('getSelected', getSelectedDataList.bind(this), false)
    }

    this.created = true
  }

  bindEvent () {
    const table = this.tableInstance.table
    const headCheck = table.querySelector('.it-thead.shadow .it-checkbox')

    let type = 0

    headCheck.addEventListener('change', ev => {
      ev.stopPropagation()
      type = +!type

      // 反选
      if (type && this.selection.length) {
        type = 2
      }

      this.selection.length = 0

      for (const uuid in this.recorder) {
        const checkbox = this.recorder[uuid].target
        switch (type) {
          case 0: {
            checkbox.checked = false
            break
          }
          case 1: {
            checkbox.checked = true
            this.selection.push(uuid)
            break
          }
          case 2: {
            checkbox.checked = !checkbox.checked
            if (checkbox.checked) {
              this.selection.push(uuid)
            }
            break
          }
        }
      }

      headCheck.checked = !!type

      const filter = this.tableInstance.plugins ? (this.tableInstance.plugins.filter.instance || null) : null

      if (filter) {
        filter.dispatchChange()
      }

      if (this.state.filterable) {
        this.tableInstance.refresh()
      }
    })
  }
}
