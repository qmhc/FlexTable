/**
 *	@name selector
 *	@description 表格数据选择 (复选框)
 */

import { getUuid } from '@/utils'
import { inputTemp } from 'core/temps'

import './style.scss'

function getSelectedDataList() {
	const selectedDataList = []
	for (let id of this.selection) {
		const data = { ...this.recorder[id].rowData }
		selectedDataList.push(data)
	}
	return selectedDataList
}

const checkboxTemp = inputTemp.cloneNode()
checkboxTemp.setAttribute('type', 'checkbox')
checkboxTemp.className = 'it-check'

export default class Selector {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance

		const { useSelector } = options

		if (useSelector !== true) {
			return false
		}

		const { data, columns } = this.tableInstance

		for (let rowData of data) {
			rowData._itId = getUuid()
		}

		this.selection = []
		this.recorder = {}

		const headCheck = checkboxTemp.cloneNode()

		const selector = {
			name: headCheck,
			accessor: data => {
				const uuid = data._itId

				if (!uuid) {
					return false
				}

				let rowCheck = null

				if (this.recorder[uuid]) {
					rowCheck = this.recorder[uuid].target
				} else {
					rowCheck = checkboxTemp.cloneNode()

					this.recorder[uuid] = {
						target: rowCheck,
						rowData: data,
					}

					rowCheck.addEventListener('change', function() {
						if (rowCheck.checked) {
							this.selection.push(uuid)
						} else {
							const index = this.selection.indexOf(uuid)
							if (index !== -1) {
								this.selection.splice(index, 1)
							}
						}
					})

					rowCheck._itId = uuid
				}

				return rowCheck
			},
			resizer: false,
			sorter: false,
			editor: false,
			filter: (value, filter) => {
				const selected = this.selection.includes(value._itId)
				return filter? selected: true
			},
			filterOptions: {
				type: 'check',
			},
			defaultWidth: 32
		}

		const children = columns[0].children

		if (children && children.length) {
			children.unshift(selector)
		} else {
			columns.unshift(selector)
		}

		this.state = this.tableInstance.state
		this.state.useSelector = useSelector
	}

	shouldUse () {
		return this.state.useSelector
	}
	
	create () {
		this.tableInstance.registerMethod('getSelected' ,getSelectedDataList)
		this.created = true
	}

	bindEvent () {
		const table = this.tableInstance.table
		const headCheck = table.querySelector('.it-thead.shadow .it-check')

		let type = 0

		const filter = this.tableInstance.plugins ? (this.tableInstance.plugins.filter || null) : null
		
		headCheck.addEventListener('change', function(ev) {
			ev.stopPropagation()
			type = +!type

			// 反选
			if (type && this.selection.length) {
				type = 2
			}

			this.selection.length = 0

			for (let uuid in this.recorder) {
				const checkbox = this.recorder[uuid].target;
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

			if (filter) {
				filter.dispatchChange()
			}

			if (this.state.filterable) {
				renderBodyData(target)
			}
		})
	}
}
