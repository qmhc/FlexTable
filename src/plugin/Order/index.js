/* eslint-disable */
import { getType, renderElement } from '@/utils'

import './style.scss'

export default class Plugin {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { columns, state } = this.tableInstance

    const able = getType(options.order) === 'object'

    if (able) {
      let { renderer, type, columnName,  columnWidth } = options.order

      let _absolute = false

      Reflect.defineProperty(this, 'absolute', {
        get () {
          return _absolute
        },
        set (value) {
          const change = _absolute !== (value === true)

          _absolute = value === true

          if (_absolute) {
            this.absoluteOrderMap = new WeakMap()

            const { data } = this.tableInstance

            for (let i = 0, len = data.length; i < len; i++) {
              this.absoluteOrderMap.set(data[i], i + 1)
            }
          }

          if (change && this.tableInstance.refresh) {
            this.tableInstance.refresh()
          }
        }
      })

      this.absolute = type !== 'relative'

      state.order = {
        able,
        renderer,
        type,
        columnWidth,
        columnName
      }

      if (getType(renderer) !== 'function') {
        renderer = index => index
      }

      const order = {
        name: columnName || 'Order',
        className: 'it-order',
        accessor: data => {
          const orderMap = this.absolute ? this.absoluteOrderMap : this.relativeOrderMap
          const index = orderMap.get(data)

          if (this.state.renderer) {
            return this.state.renderer(index)
          }

          return index
        },
        resize: false,
        sort: this.absolute,
        edit: false,
        filter: false,
        defaultWidth: columnWidth || 60
      }

      const dataColumnIndex = columns.findIndex(item => item.lock !== true)
      const children = columns[dataColumnIndex].children

      if (children && children.length) {
        const index = children.findIndex(item => item.className === 'it-order')
        if (!~index) {
          const _dataColumnIndex = children.findIndex(item => item.lock !== true)
          children.splice(_dataColumnIndex, 0, order)
        } else {
          children.splice(index, 1, order)
        }
      } else {
        const index = columns.findIndex(item => item.className === 'it-order')
        if (!~index) {
          columns.splice(dataColumnIndex, 0, order)
        } else {
          columns.splice(index, 1, order)
        }
      }
    } else {
      state.order = { able }
    }

    this.state = state.order
  }

  // 实例化后可基于 FlexTable 的完整 state 进行处理
  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  // 判断插件是否该使用
  shouldUse () {
    return this.state.able
  }

  // 根据表格数据进行处理, 并返回新数据
  beforeRenderData (data) {
    if (this.absolute) {
      const globalData = this.tableInstance.data

      for (let i = 0, len = data.length; i < len; i++) {
        const rowData = data[i]
        if (!this.absoluteOrderMap.has(rowData)) {
          const index = globalData.findIndex(item => item === rowData) + 1

          if (index) {
            this.absoluteOrderMap.set(rowData, index)
          }
        }
      }

      return data
    }

    this.relativeOrderMap = new WeakMap()

    for (let i = 0, len = data.length; i < len; i++) {
      this.relativeOrderMap.set(data[i], i + 1)
    }

    return data
  }

  create () {
    // create code
    this.created = true
  }
}
