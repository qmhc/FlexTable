/**
 * @name Selector
 * @description 表格数据选择 (复选框)
 */

import { getType } from '@/utils'
import { addEventWhiteList, dispatchEvent } from 'core/events'
import { inputTemp } from 'core/temps'

import './style.scss'

function getSelectedDataList () {
  const selectedDataList = []
  for (const id of this.selection) {
    const data = { ...this.recorder[id].rowData }
    selectedDataList.push(data)
  }
  return selectedDataList
}

const checkboxTemp = inputTemp.cloneNode()
checkboxTemp.setAttribute('type', 'checkbox')
checkboxTemp.className = 'it-check'

export default class Selector {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const selectable = getType(options.selector) === 'object'

    if (selectable) {
      const { columns } = this.tableInstance

      this.selection = []
      this.recorder = {}

      const headCheck = checkboxTemp.cloneNode()

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
            rowCheck = checkboxTemp.cloneNode()

            this.recorder[uuid] = {
              target: rowCheck,
              rowData: data
            }

            rowCheck.addEventListener('change', () => {
              let type = 'select'

              if (rowCheck.checked) {
                this.selection.push(uuid)
              } else {
                const index = this.selection.indexOf(uuid)

                if (index !== -1) {
                  this.selection.splice(index, 1)
                }

                type = 'cancel'
              }

              dispatchEvent.apply(this.tableInstance, ['selectChange', { type, id: uuid, data: { ...data }, selection: [...this.selection] }])
            })

            rowCheck._itId = uuid
          }

          return rowCheck
        },
        resize: false,
        sort: false,
        edit: false,
        // filter: {
        //   type: 'check',
        //   method: (value, filter) => {
        //     const selected = this.selection.includes(value._itId)
        //     return filter ? selected : true
        //   }
        // },
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
    const headCheck = table.querySelector('.it-thead.shadow .it-check')

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
