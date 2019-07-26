/**
 *	@name sorter
 *	@description 表格数据排序
 */

import { getKeyState, registerKey, isKeyRegistered } from 'core/events'
import { getType, sortByProps, checkPathByClass } from '@/utils'

import './style.scss'

function getPluralSortData(data) {
	const { table, columnProps } = this.tableInstance
	let { sortBy, types } = this.state
	const sortHandlers = table.querySelectorAll('.it-sort')

	const optinos = sortBy.map(
		(value, index) => {
			const props = columnProps.find(cp => cp.id === value)
			const type = types[index] === 1? 'asc': 'desc'
			const { accessor, sorter, index: key } = props

			switch (types[index]) {
				case 1: sortHandlers[key].classList.add('asc'); break
				case 2: sortHandlers[key].classList.add('desc'); break
			}

			return { type, accessor, sorter }
		}
	)

	return sortByProps(data, optinos)
}

const defaultSortMethod = (a, b) => a.toString().localeCompare(b)

const multipleKeyWhitelist = {
	ctrl: 17,
	shift: 16,
	alt: 18
}

for (let name in multipleKeyWhitelist) {
	const code = multipleKeyWhitelist[name]
	if (!isKeyRegistered(code)) {
		registerKey(code)
	}
}

export default class Sorter {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance
		this.getSortData = getPluralSortData.bind(this)

		const { state } = this.tableInstance

		const sortable = getType(options.sorter) === 'object'

		if (sortable) {
			const { multiple, multipleKey } = options.sorter

			const keyName = getType(multipleKey) === 'string' ? multipleKey.toLowerCase() : ''

			state.sorter = {
				sortable,
				sortBy: [undefined], // 记录列id
				types: [0], // 0 normal | 1 asc | 2 desc
				sortData: undefined,
				multiple: multiple === true,
				multipleKey: Object.keys(multipleKeyWhitelist).includes(keyName) ? multipleKeyWhitelist[keyName] : multipleKeyWhitelist.shift
				// cache: cache === true // 多列排序缓存, 在与分页插件的结合上存在一些问题, 暂不实现
			}
		} else {
			state.sorter = {
				sortable
			}
		}

		this.state = state.sorter
	}

	afterContruct () {
		this.globalState = this.tableInstance.state
	}

	shouldUse () {
		return this.state.sortable !== false
	}

	beforeRenderData (data) {
		const { sortable, sortBy } = this.state

		if (sortable && typeof sortBy[0] !== 'undefined') {
			data = this.getSortData(data)
		}

		return data
	}

	create () {
		const { table, columnProps } = this.tableInstance
		const ths = table.querySelectorAll('.it-thead.shadow .it-th')

		for (let i = 0, len = ths.length; i < len; i++) {
			const props = columnProps[i]

			const { sorter, sortable } = props

			props.sorter = sorter !== false ? typeof value === 'function'? value : defaultSortMethod : false
			props.sortable = sortable !== false && props.sorter ? true : false

			const th = ths[i]
			th.classList.add('it-sort')

			if (!props.sortable) {
				th.classList.add('disabled')
			}
		}

		// if (this.state.cache) {
		// 	this.cacheData = new Map()
		// }

		this.created = true
	}

	bindEvent () {
		const { table, columnProps } = this.tableInstance

		table.addEventListener('click', ev => {
			if (this.globalState.resizer && this.globalState.resizer.resizing) {
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

				if (props.sortable) {
					let { sortBy, types, multiple, multipleKey } = this.state

					console.log(getKeyState(multipleKey))
					if (multiple && typeof sortBy[0] !== 'undefined' && (sortBy.length !== 1 || sortBy[0] !== id) && getKeyState(multipleKey)) {
						const targetIndex = sortBy.findIndex(value => value === id)
						let sortIndex = 0

						if (targetIndex !== -1) {
							sortIndex = targetIndex
							types[sortIndex] = (types[sortIndex] + 1) % 3

							if (!types[sortIndex]) {
								sortBy.splice(sortIndex, 1)
								types.splice(sortIndex, 1)
								target.classList.remove('asc', 'desc')
							}
						} else {
							sortIndex = sortBy.push(id) - 1
							types[sortIndex] = 1
						}
					} else {
						if (sortBy.length > 1 || sortBy[0] !== id) {
							this.state.sortBy = [id]
							this.state.types = [0]
						}

						table.querySelectorAll('.asc, .desc').forEach(
							value => value.classList.remove('asc', 'desc')
						)

						sortBy = this.state.sortBy
						types = this.state.types
						types[0] = (types[0] + 1) % 3

						if (!types[0]) {
							sortBy[0] = undefined
						} else {
							switch (types[0]) {
								case 1: {
									target.classList.add('asc')
									break
								}
								case 2: {
									target.classList.add('desc')
									break
								}
							}
						}
					}

					this.tableInstance.refresh()
				}
			}
		})
	}
}
