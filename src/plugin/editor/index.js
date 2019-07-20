/**
 *	@name editor
 *	@description 表格编辑插件
 */

import {
	temp,
	inputTemp,
} from 'core/temps';
import { checkPathByClass } from '../../utils'

export default class {
	constructor(tableInstance, options) {
		this.tableInstance = tableInstance
    
    const { columns } = this.tableInstance
    let { editable, editType } = options
    editable = editable === true
    editType = editType === 'row' ? 1 : 0

    if (editable) {
      for (let i in columns) {
        const column = columns[i]
        if (column.children || column.children.length) {
          for (let j in column.children) {
            const truthColumn = column.children[j]
            truthColumn.editable = typeof truthColumn.key === 'string' ? true : false;
          }
        } else {
          column.editable = typeof truthColumn.key === 'string' ? true : false;
        }
      }
    }

    this.tableInstance.state = {
      ...this.tableInstance.state,
      editable,
      editType
    }

    this.state = this.tableInstance.state
	}
	shouldUse() {
		return this.state.editable
	}
	// 根据表格行数进行处理, 并返回新行数
	beforeRenderBody(count) {}
	// 根据表格数据进行处理, 并返回新数据
	beforeRenderData(data) {}
	beforeCreate() {}
	create() {
		// create code
		this.created = true
	}
	bindEvent() {
    const { table, data, columPropns } = this.tableInstance
    const { editType } = this.state
    const body = table.querySelector('.it-tbody')

    body.addEventListener('click', ev => {
      const node = checkPathByClass(ev.target, 'it-td')
      if (node) {
        console.log(prop, rowDate, editType)
        const index = node.columnIndex
        const dataIndex = node.rowIndex
        const rowDate = data[dataIndex]
        // 整行编辑
        if (editType === 1) {
          for (let i in columPropns) {
            const prop = columPropns[i]
            if (prop.editable) {
              const data = rowDate[prop.key]
            }
          }
        } else {
          const prop = columPropns[index]
          if (!prop.editable) return false
          const data = rowDate[prop.key]
        }
        
      }
    })
  }
	afterCreate() {}
	// 根据表格行数进行处理
	afterRenderBody(count) {}
	// 根据表格数据进行处理
	afterRenderData(data) {}
}
