/**
 *	@name editor
 *	@description 表格编辑插件
 */

import { temp, inputTemp, buttonTemp } from 'core/temps'
import { checkPathByClass, getType, createSelect } from '../../utils'

import './style.scss'

const inputTypeWhitelist = ['text', 'number', 'date', 'week', 'month', 'time', 'datetime-locat']

const editInputTemp = inputTemp.cloneNode()
editInputTemp.classList.add('it-editor-control')

function createEditButton (data) {
  const editButton = buttonTemp.cloneNode()
  editButton.classList.add('it-editor-edit')
  editButton.textContent = this.labels.edit

  editButton.addEventListener('click', () => {
    const rowActions = editButton.parentNode

    if (!rowActions) {
      return false
    }

    rowActions.classList.add('editing')

    const { columnProps } = this.tableInstance

    let tr = null

    try {
      tr = rowActions.parentNode.parentNode
    } catch (e) {}

    if (tr) {
      const tds = tr.querySelectorAll('.it-td')

      for (let i = 0, len = tds.length; i < len; i++) {
        const td = tds[i]
        const props = columnProps[i]

        if (props && props.editable !== false) {
          td.classList.add('editing')

          const { key, editType, editOptions } = props

          let control = null

          if (editType === 'select') {
            control = createSelect(editOptions)
            control.classList.add('it-editor-control')
            control.itValue = data[key]
          } else {
            control = editInputTemp.cloneNode()

            let inputType = 'text'

            if (inputTypeWhitelist.includes(editType)) {
              inputType = editType
            }

            control.setAttribute('type', inputType)

            control.value = data[key]
          }
          
          td.innerHTML = ''
          td.appendChild(control)
        }
      }
    }

    return false
  })

  return editButton
}

function createSaveButton (data) {
  const saveButton = buttonTemp.cloneNode()
  saveButton.classList.add('it-editor-save')
  saveButton.textContent = this.labels.save

  saveButton.addEventListener('click', () => {
    const rowActions = saveButton.parentNode

    if (!rowActions) {
      return false
    }
    
    rowActions.classList.remove('editing')

    const { columnProps } = this.tableInstance

    let tr = null

    try {
      tr = rowActions.parentNode.parentNode
    } catch (e) {}

    if (tr) {
      const tds = tr.querySelectorAll('.it-td')

      for (let i = 0, len = tds.length; i < len; i++) {
        const td = tds[i]

        if (td.classList.contains('editing')) {
          const control = td.querySelector('.it-editor-control')
          if (!control) {
            continue
          }

          const { verifier, key, accessor } = columnProps[i]
          const content = control.value

          if (getType(verifier) === 'function') {
            if (!verifier(content)) {
              continue
            }
          }

          if (getType(this.verifier) === 'function') {
            if (!this.verifier(content)) {
              continue
            }
          }

          data[key] = content
          const html = accessor(data) || ''
          insertData(td, html)
        }
      }
    }

    return false
  })

  return saveButton
}

function createCancelButton (data) {
  const cancelButton = buttonTemp.cloneNode()
  cancelButton.classList.add('it-editor-cancel')
  cancelButton.textContent = this.labels.cancel

  cancelButton.addEventListener('click', () => {
    const rowActions = cancelButton.parentNode

    if (!rowActions) {
      return false
    }
    
    rowActions.classList.remove('editing')

    const { columnProps } = this.tableInstance

    let tr = null

    try {
      tr = rowActions.parentNode.parentNode
    } catch (e) {}

    if (tr) {
      const tds = tr.querySelectorAll('.it-td')

      for (let i = 0, len = tds.length; i < len; i++) {
        const td = tds[i]
        const { accessor } = columnProps[i]

        const html = accessor(data) || ''
        insertData(td, html)
      }
    }

    return false
  })

  return cancelButton
}

function insertData (cell, data) {
  switch (getType(data)) {
    case 'number':
    case 'string': {
      cell.textContent = data
      break
    }
    case 'array':
    case 'nodelist': {
      cell.innerHTML = ''
      const fragment = document.createDocumentFragment()

      while (data.length > 0) {
        fragment.appendChild(data[0])
      }

      cell.appendChild(fragment)
      break
    }
    default: {
      cell.innerHTML = ''
      cell.appendChild(data)
    }
  }
}

export default class {
	constructor(tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { columns, state } = this.tableInstance
    
    const editable = getType(options.editor) === 'object'

    if (editable) {
      const { trigger, verifier, columnWidth } = options.editor

      const labels = options.editor.labels || {}

      this.labels = {
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        ...labels
      }

      this.trigger = trigger === 'action' ? 1 : 0
      this.verifier = getType(verifier) === 'function' ? verifier : null
    
      for (let i in columns) {
        const column = columns[i]
        if (column.children && column.children.length) {
          for (let j in column.children) {
            const truthColumn = column.children[j]
            truthColumn.editable = truthColumn.editable !== false ? (getType(truthColumn.key) === 'string' ? true : false) : false
          }
        } else {
          column.editable = column.editable !== false ? (getType(column.key) === 'string' ? true : false) : false
        }
      }

      // 使用独立编辑时, 添加action列
      if (this.trigger) {
        this.recorder = {}

        const editAction = {
          name: 'Action',
          accessor: data => {
            const uuid = data._itId

            if (!uuid) {
              return ''
            }

            let rowActions = null

            if (this.recorder[uuid]) {
              rowActions = this.recorder[uuid]
            } else {
              rowActions = temp.cloneNode()
              rowActions.classList.add('it-editor-actions')

              this.recorder[uuid] = rowActions

              // 编辑按钮
              const editButton = createEditButton.call(this, data)

              // 保存按钮
              const saveButton = createSaveButton.call(this, data)

              // 取消按钮
              const cancelButton = createCancelButton.call(this, data)

              rowActions.appendChild(editButton)
              rowActions.appendChild(saveButton)
              rowActions.appendChild(cancelButton)

              rowActions._itId = uuid
            }

            return rowActions
          },
          resizable: false,
          sortable: false,
          filterable: false,
          editable: false,
          defaultWidth: columnWidth || 142
        }

        const children = columns[columns.length - 1].children

        if (children && children.length) {
          children.push(editAction)
        } else {
          columns.push(editAction)
        }
      }

      state.editor = {
        editable,
        trigger: this.trigger,
        verifier: this.verifier,
        columnWidth: columnWidth || 142
      }
    } else {
      state.editor = {
        editable
      }
    }

    this.state = state.editor
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }
  
	shouldUse() {
		return this.state.editable
  }
  
	create() {
    // create code
		this.created = true
  }
  
	bindEvent() {
    // trigger is not click
    if (this.state.trigger) {
      return false
    }

    const { table, data, columnProps } = this.tableInstance
    const body = table.querySelector('.it-tbody')

    const updateData = (node, control, accessor, verifier, rowData, key) => {
      const content = control.value

      if (getType(verifier) === 'function') {
        if (!verifier(content)) {
          return false
        }
      }

      if (getType(this.verifier) === 'function') {
        if (!this.verifier(content)) {
          return false
        }
      }

      rowData[key] = content
      const html = accessor(rowData) || ''
      insertData(node, html)

      setTimeout(() => {
        node.classList.remove('editing')
      }, 300)
    }

    body.addEventListener('click', ev => {
      if (this.globalState.scroller && this.globalState.scroller.scrolling) {
        return false
      }

      const node = checkPathByClass(ev.target, 'it-td')
      
      if (node) {
        if (node.classList.contains('editing')) {
          return false
        }

        const index = node.columnIndex
        const uuid = node.parentNode.itRowId
        const rowData = data.find(item => item._itId === uuid)
        const props = columnProps[index]

        if (props && props.editable && rowData) {
          node.classList.add('editing')

          const { key, accessor, verifier, editType, editOptions } = props

          if (editType === 'select') {
            const select = createSelect(editOptions)
            select.classList.add('it-editor-control')
            select.itValue = rowData[key]

            const clickOutside = ev => {
              const path = [...ev.path]

              if (!path.includes(select)) {
                if (select.isOptionsOpen) {
                  select.addEventListener('transitionend', () => {
                    updateData(node, select, accessor, verifier, rowData, key)
                    // node.style.overflow = ''
                    document.removeEventListener('click', clickOutside)
                  })
                  select.closeOptions()
                } else {
                  updateData(node, select, accessor, verifier, rowData, key)
                  // node.style.overflow = ''
                  document.removeEventListener('click', clickOutside)
                }
              }

              return false
            }

            // node.style.overflow = 'visible'
            node.innerHTML = ''
            node.appendChild(select)

            setTimeout(() => {
              document.addEventListener('click', clickOutside)
            }, 200)
          } else {
            const input = editInputTemp.cloneNode()
            input.value = rowData[key]

            let inputType = 'text'

            if (inputTypeWhitelist.includes(editType)) {
              inputType = editType
            }

            input.setAttribute('type', inputType)

            input.addEventListener('blur', () => {
              updateData(node, input, accessor, verifier, rowData, key)
              return false
            })

            node.innerHTML = ''
            node.appendChild(input)

            input.focus()
          }
        }
        
        return false
      }
    })
  }
}
