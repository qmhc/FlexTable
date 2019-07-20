/**
 *	@name sorter
 *	@description 表格数据排序
 */

import { getKeyState } from 'core/events'
import { sortByProps, checkPathByClass } from '@/utils'

import './style.scss'

function getPluralSortData(data) {
	const { table, columnProps } = this.tableInstance
	let { sortBy, sortType } = this.state
	const sortHandlers = table.querySelectorAll('.it-sort')

	const optinos = sortBy.map(
		(value, index) => {
			const props = columnProps.find(cp => cp.id === value)
			const type = sortType[index] === 1? 'asc': 'desc'
			const { accessor, sorter, index: key } = props

			switch (sortType[index]) {
				case 1: sortHandlers[key].classList.add('asc'); break
				case 2: sortHandlers[key].classList.add('desc'); break
			}

			return { type, accessor, sorter }
		}
	)

	return sortByProps(data, optinos)
}

const defaultSortMethod = (a, b) => a.toString().localeCompare(b)

export default class Sorter {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance
		this.getSortData = getPluralSortData.bind(this)
		
		const { sortable, sortCache } = options

		this.tableInstance.state = {
			...this.tableInstance.state,
			sortable: sortable !== false,
			sortBy: [undefined],
			sortType: [0],			// 0 normal | 1 asc | 2 desc
			sortData: undefined,
			sortCache: sortCache === true, // 多列排序缓存
		}

		this.state = this.tableInstance.state
	}

	shouldUse () {
		return this.state.sortable !== false
	}

	beforeRenderData (data) {
		const { sortBy } = this.state

		if (typeof sortBy[0] !== 'undefined') {
			data = this.getSortData(data)
		}

		return data
	}

	beforeCreate () {
		const { columnProps } = this.tableInstance

		for (let props of columnProps) {
			const { sorter } = props
			props.sorter = sorter !== false? typeof value === 'function'? value: defaultSortMethod: false
		}
	}

	create () {
		const table = this.tableInstance.table
		const ths = table.querySelectorAll('.it-thead.shadow .it-th')

		for (let i = 0, len = ths.length; i < len; i++) {
			const th = ths[i]
			th.classList.add('it-sort')
		}

		if (this.state.sortCache) {
			this.sortCacheData = new Map()
		}

		this.created = true
	}

	bindEvent () {
		const { table, columnProps } = this.tableInstance

		table.addEventListener('click', ev => {
			if (this.state.resizing) {
				return false
			}

			const evt = ev || event
			const path = evt.path

			let target = null

			if (path) {
				target = path.find(value => value.classList && value.classList.contains('it-sort'))
			} else {
				target = evt.target || evt.srcElement
				target = checkPathByClass(target, 'it-sort')
			}

			if (target) {
				const id = target.itColumnId
				
				if (!id) {
					return false
				}

				const props = columnProps.find(value => value.id === id)
				const { sorter } = props

				if (sorter) {
					let { sortBy, sortType } = this.state
					
					if (typeof sortBy[0] !== 'undefined' && (sortBy.length !== 1 || sortBy[0] !== id) && getKeyState('shift')) {
						const targetIndex = sortBy.findIndex(value => value === id)
						let sortIndex = 0

						if (targetIndex !== -1) {
							sortIndex = targetIndex
							sortType[sortIndex] = (sortType[sortIndex] + 1) % 3

							if (!sortType[sortIndex]) {
								sortBy.splice(sortIndex, 1)
								sortType.splice(sortIndex, 1)
								target.classList.remove('asc', 'desc')
							}
						} else {
							sortIndex = sortBy.push(id) - 1
							sortType[sortIndex] = 1
						}
					} else {
						if (sortBy.length > 1 || sortBy[0] !== id) {
							this.state.sortBy = [id];
							this.state.sortType = [0];
						}

						table.querySelectorAll('.asc, .desc').forEach(
							value => value.classList.remove('asc', 'desc')
						)

						sortBy = this.state.sortBy
						sortType = this.state.sortType
						sortType[0] = (sortType[0] + 1) % 3

						if (!sortType[0]) {
							sortBy[0] = undefined
						} else {
							switch (sortType[0]) {
								case 1: target.classList.add('asc'); break
								case 2: target.classList.add('desc'); break
							}
						}
					}

					this.tableInstance.renderBodyData()
				}
				// console.timeEnd('sort');
			}
		})
	}
}
