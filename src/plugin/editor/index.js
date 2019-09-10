/* eslint-disable */
/**
 * @name Editor
 * @description 表格编辑插件
 */

import { temp, buttonTemp } from 'core/temps'
import { TextControl, NumberControl, SelectControl } from './control'
import { addEventWhiteList, dispatchEvent, registerClickOutside, unregisterClickOutside } from 'core/events'
import { checkPathByClass, getType, renderElement } from '@/utils'
import nextTick from '@/utils/next-tick'

import './style.scss'

const inputTypeWhiteList = ['text', 'number']

const controlContructors = {
  'text': TextControl,
  'number': NumberControl,
  'select': SelectControl
}

// TODO: 添加 check, radio 类型编辑控件, 美化按钮
export default class {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { columns, state } = this.tableInstance

    const editable = getType(options.editor) === 'object'

    if (editable) {
      const { trigger, verifier, columnWidth, columnName } = options.editor

      const labels = options.editor.labels || {}

      this.labels = {
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        ...labels
      }

      this.trigger = trigger === 'action' ? 1 : 0
      this.verifier = getType(verifier) === 'function' ? verifier : null

      for (const i in columns) {
        const column = columns[i]

        if (column.children && column.children.length) {
          for (const j in column.children) {
            column.children[j] = {
              editable: true,
              ...column.children[j]
            }

            const truthColumn = column.children[j]

            truthColumn.edit = getType(truthColumn.key) === 'string' ? truthColumn.edit : false
          }
        } else {
          columns[i] = {
            edit: true,
            ...columns[i]
          }

          columns[i].edit = getType(columns[i].key) === 'string' ? columns[i].edit : false
        }
      }

      this.editingCount = 0

      // 使用独立编辑时, 添加action列
      if (this.trigger) {
        this.recorder = {}

        const editAction = {
          name: columnName || 'Action',
          className: 'it-editor-item',
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
              const editButton = this._createEditButton(data)

              // 保存按钮
              const saveButton = this._createSaveButton(data)

              // 取消按钮
              const cancelButton = this._createCancelButton(data)

              rowActions.appendChild(editButton)
              rowActions.appendChild(saveButton)
              rowActions.appendChild(cancelButton)

              rowActions._itId = uuid
            }

            return rowActions
          },
          resize: false,
          sort: false,
          filter: false,
          edit: false,
          defaultWidth: columnWidth || 142
        }

        const children = columns[columns.length - 1].children

        if (children && children.length) {
          const index = children.findIndex(item => item.className === 'it-editor-item')
          if (!~index) {
            children.push(editAction)
          } else {
            children.splice(index, 1, editAction)
          }
        } else {
          const index = columns.findIndex(item => item.className === 'it-editor-item')
          if (!~index) {
            columns.push(editAction)
          } else {
            columns.splice(index, 1, editAction)
          }
        }
      }

      state.editor = {
        editable,
        trigger: this.trigger,
        verifier: this.verifier,
        columnWidth: columnWidth || 142,
        columnName: columnName || 'Action'
      }

      addEventWhiteList.apply(this.tableInstance, ['editSave', 'editCancel'])
    } else {
      state.editor = {
        editable
      }
    }

    this.controls = {}
    this._clickEventName = this.tableInstance.constructor._clickEventName || 'click'
    this.state = state.editor
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.editable
  }

  create () {
    // create code
    const { table, columnProps } = this.tableInstance
    const { editable } = this.state

    const defaultEdit = {
      able: editable,
      type: 'text',
      verifier: null
    }

    for (const props of columnProps) {
      const { edit } = props

      switch (getType(edit)) {
        case 'string': {
          if (inputTypeWhiteList.includes(edit)) {
            props.edit = {
              ...defaultEdit,
              type: edit
            }
          } else {
            props.edit = {
              ...defaultEdit
            }
          }

          break
        }
        case 'boolean':
        case 'function': {
          props.edit = {
            ...defaultEdit,
            able: edit
          }
          break
        }
        case 'object': {
          props.edit = {
            ...defaultEdit,
            ...edit
          }
          break
        }
        default: {
          props.edit = {
            ...defaultEdit
          }
        }
      }
    }

    this.topAction = table.querySelector('.it-th.it-editor-item')
    this.created = true
  }

  bindEvent () {
    // trigger is not click
    if (this.state.trigger) {
      return false
    }

    const { table, data, columnProps } = this.tableInstance
    const body = table.querySelector('.it-tbody')

    body.addEventListener(this._clickEventName, evt => {
      if (this.tableInstance._lock) {
        return false
      }

      const path = evt.path

      let node = null

      if (path) {
        node = path.find(value => value.classList && value.classList.contains('it-td'))
      } else {
        node = evt.target || evt.srcElement
        node = checkPathByClass(node, 'it-td')
      }

      if (node) {
        if (node.classList.contains('editing')) {
          return false
        }

        const index = node.columnIndex
        const tr = node.parentNode
        const uuid = tr.itRowId
        const rowIndex = tr.rowIndex
        const rowData = data.find(item => item._itId === uuid)
        const props = columnProps[index]

        let able = props.edit.able

        if (getType(able) === 'function') {
          able = able(rowData)
        }

        if (able === true && rowData) {
          node._itLock = true
          node.classList.add('editing')

          this.editingCount++

          const { key, edit, accessor } = props
          const type = edit.type
          const { control, ...options } = edit

          if (!this.controls[rowIndex]) {
            this.controls[rowIndex] = {}
          }

          const controls = this.controls[rowIndex]

          if (!controls[index]) {
            let Construct

            if (controlContructors[type]) {
              Construct = controlContructors[type]
            } else {
              if (type === 'custom' && getType(control) === 'function') {
                Construct = control
              } else {
                return false
              }
            }

            controls[index] = new Construct(options)
          }

          const instance = controls[index]

          if (getType(instance.onEdit) === 'function') {
            instance.onEdit(rowData[key])
          }

          node.classList.add('editing')
          this._insertData(node, instance.el)

          if (getType(instance.el.focus) === 'function') {
            instance.el.focus()
          }

          registerClickOutside(node)

          node.addEventListener('clickoutside', () => {
            const { verifier } = edit

            const value = instance.onSave()

            if (getType(this.verifier) === 'function') {
              if (!this.verifier(value)) {
                if (getType(instance.onError) === 'function') {
                  instance.onError()
                }
  
                return false
              }
            }
  
            if (getType(verifier) === 'function') {
              if (!verifier(value)) {
                if (getType(instance.onError) === 'function') {
                  instance.onError()
                }
  
                return false
              }
            }

            if (getType(instance.onFinish) === 'function') {
              instance.onFinish()
            }

            unregisterClickOutside(node)
            node._itLock = false

            rowData[key] = value

            const html = accessor(rowData, props)

            node.classList.remove('editing')
            this._insertData(node, html)
          })
        }

        return false
      }
    })
  }

  _createEditButton (data) {
    const editButton = buttonTemp.cloneNode()
    editButton.classList.add('it-editor-edit')
    editButton.textContent = this.labels.edit

    editButton.addEventListener(this._clickEventName, () => {
      const rowActions = editButton.parentNode

      if (!rowActions) {
        return false
      }

      rowActions.classList.add('editing')

      // 暂时没用
      this.editingCount++

      const { columnProps } = this.tableInstance

      let tr = null

      try {
        tr = rowActions.parentNode.parentNode
      } catch (e) {}

      if (tr) {
        const uid = tr.itRowId
        const tds = tr.querySelectorAll('.it-td')

        if (!this.controls[uid]) {
          this.controls[uid] = {}
        }

        const controls = this.controls[uid]

        for (let i = 0, len = tds.length; i < len; i++) {
          const td = tds[i]
          const props = columnProps[i]

          let editable = props.edit.able

          if (getType(editable) === 'function') {
            editable = !!editable(data)
          }

          if (props && editable !== false) {
            td.classList.add('editing')

            const { key, edit } = props
            const type = edit.type
            const { control, ...options } = edit

            if (!controls[i]) {
              let Construct

              if (controlContructors[type]) {
                Construct = controlContructors[type]
              } else {
                if (type === 'custom' && getType(control) === 'function') {
                  Construct = control
                } else {
                  continue
                }
              }

              controls[i] = new Construct(options)
            }

            const instance = controls[i]

            if (getType(instance.onEdit) === 'function') {
              instance.onEdit(data[key])
            }

            this._insertData(td, instance.el)
          }
        }
      }

      return false
    })

    return editButton
  }

  _createSaveButton (data) {
    const saveButton = buttonTemp.cloneNode()
    saveButton.classList.add('it-editor-save')
    saveButton.textContent = this.labels.save

    saveButton.addEventListener(this._clickEventName, () => {
      const rowActions = saveButton.parentNode

      if (!rowActions) {
        return false
      }

      const { columnProps } = this.tableInstance

      let tr = null

      try {
        tr = rowActions.parentNode.parentNode
      } catch (e) {}

      if (tr) {
        const uid = tr.itRowId
        const tds = tr.querySelectorAll('.it-td')
        const controls = this.controls[uid]

        let hasError = false

        for (let i = 0, len = tds.length; i < len; i++) {
          if (!controls[i]) {
            continue
          }

          const td = tds[i]
          const props = columnProps[i]
          const instance = controls[i]

          const value = instance.onSave()

          const { key, accessor, edit } = props
          const { verifier } = edit

          if (getType(this.verifier) === 'function') {
            if (!this.verifier(value)) {
              if (getType(instance.onError) === 'function') {
                instance.onError()
              }

              hasError = true
              continue
            }
          }

          if (getType(verifier) === 'function') {
            if (!verifier(value)) {
              if (getType(instance.onError) === 'function') {
                instance.onError()
              }

              hasError = true
              continue
            }
          }

          nextTick(() => {
            if (!hasError) {
              if (getType(instance.onFinish) === 'function') {
                instance.onFinish()
              }

              data[key] = value

              const html = accessor(data, props)

              td.classList.remove('editing')
              this._insertData(td, html)
            }
          })
        }

        if (!hasError) {
          nextTick(() => {
            this.editingCount--

            rowActions.classList.remove('editing')
            dispatchEvent.apply(this.tableInstance, ['editSave', { type: 'action', data: { ...data } }])
          })
        }
      }

      return false
    })

    return saveButton
  }

  _createCancelButton (data) {
    const cancelButton = buttonTemp.cloneNode()
    cancelButton.classList.add('it-editor-cancel')
    cancelButton.textContent = this.labels.cancel

    cancelButton.addEventListener(this._clickEventName, () => {
      const rowActions = cancelButton.parentNode

      if (!rowActions) {
        return false
      }

      const { columnProps } = this.tableInstance

      let tr = null

      try {
        tr = rowActions.parentNode.parentNode
      } catch (e) {}

      if (tr) {
        const uid = tr.itRowId
        const tds = tr.querySelectorAll('.it-td')
        const controls = this.controls[uid]

        for (let i = 0, len = tds.length; i < len; i++) {
          if (!controls[i]) {
            continue
          }

          const td = tds[i]
          const props = columnProps[i]
          const instance = controls[i]
          const { accessor } = props

          if (getType(instance.onCancel) === 'function') {
            instance.onCancel()
          }

          td.classList.remove('editing')

          const html = accessor(data, props)
          this._insertData(td, html)
        }

        this.editingCount--

        rowActions.classList.remove('editing')
        dispatchEvent.apply(this.tableInstance, ['editCancel', { type: 'action', data: { ...data } }])
      }

      return false
    })

    return cancelButton
  }

  _insertData (cell, data) {
    renderElement(cell, data, this.tableInstance.dangerous)
  }
}
