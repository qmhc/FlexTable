/**
 *	@name filter
 *	@description 表格数据过滤
 */

import {
	temp,
	theadTemp,
	trTemp,
	thTemp,
	spanTemp,
	inputTemp
} from 'core/temps'
import { getType, createSelect, html2Element } from '@/utils'

import './style.scss'

const defaultTextFilter = (value, filter) => {
	const keyWords = filter.trim().toLowerCase().split(/\s+/g)
	value = value.toString().toLowerCase()

	for (let word of keyWords) {
		if (!value.includes(word)) return false
	}

	return true
}

const defaultNumberFilter = (value, filter) => {
	value = +value

	if (Number.isNaN(value)) {
		return false
	}

	const res = (
		(typeof filter[0] !== 'number' || value >= filter[0])
		&&
		(typeof filter[1] !== 'number' || value <= filter[1])
	)

	return res
}

function getProps (id) {
	const { columnProps } = this.tableInstance;
	return columnProps.find(props => props.id === id)
}

function renderTextControl (id) {
	const props = getProps.call(this, id)

	const control = temp.cloneNode()
	control.className = 'it-filter'

	const textInput = inputTemp.cloneNode()
	textInput.setAttribute('type', 'text')

	textInput.addEventListener('input', () => {
		const value = textInput.value
		props.filterValue = value

		this.filterValueChange = true
		this.tableInstance.renderBodyData()
	})

	control.appendChild(textInput)
	return control
}

function renderDateControl (id) {
	const props = getProps.call(this, id)

	const { dateType } = props.filterOptions

	const control = temp.cloneNode()
	control.className = 'it-filter'

	const dateInput = inputTemp.cloneNode()
	dateInput.setAttribute('type', dateType || 'date')

	dateInput.addEventListener('change', () => {
		const value = dateInput.value
		props.filterValue = value

		this.filterValueChange = true
		this.tableInstance.renderBodyData()
	})

	control.appendChild(dateInput)
	return control
}

function renderNumberControl (id) {
	const props = getProps.call(this, id)

	props.filterValue = new Array(2)

	const control = temp.cloneNode()
	control.className = 'it-filter'

	const minNumberInput = inputTemp.cloneNode()
	minNumberInput.setAttribute('type', 'number')
	minNumberInput.setAttribute('placeholder', 'min')

	minNumberInput.addEventListener('input', () => {
		const value = minNumberInput.value;
		props.filterValue[0] = value !== ''? +value: undefined
		this.filterValueChange = true
		this.tableInstance.renderBodyData()
	})

	const maxNumberInput = inputTemp.cloneNode()
	maxNumberInput.setAttribute('type', 'number')
	maxNumberInput.setAttribute('placeholder', 'max')

	maxNumberInput.addEventListener('input', () => {
		const value = maxNumberInput.value;
		props.filterValue[1] = value !== ''? +value: undefined
		this.filterValueChange = true
		this.tableInstance.renderBodyData()
	})

	control.appendChild(minNumberInput)
	control.appendChild(maxNumberInput)

	return control
}

function renderSelectControl (id) {
	const props = getProps.call(this, id)

	const { options } = props.filterOptions
	options.unshift('')

	const control = temp.cloneNode()
	control.className = 'it-filter'

	const select = createSelect(options)

	select.addEventListener('change', ev => {
		const value = ev.newValue
		props.filterValue = value

		this.filterValueChange = true
		this.tableInstance.renderBodyData()
	})

	control.appendChild(select)

	return control
}

function renderCheckControl (id) {
	const props = getProps.call(this, id)

	const control = temp.cloneNode()
	control.className = 'it-filter'

	const checkbox = inputTemp.cloneNode();
	checkbox.setAttribute('type', 'checkbox')
	checkbox.addEventListener('change', () => {
		const checked = checkbox.checked
		props.filterValue = checked;
		this.filterValueChange = true
		this.tableInstance.renderBodyData()
	});

	control.appendChild (checkbox)
	return control
}

function getPorxyAccessor (accessor, filterValue) {
	switch (typeof filterValue) {
		case 'object': return rowData => {
			const value = accessor(rowData)
			const html = (value === 0 || value) ? `<span class="it-highlight">${value}</span>` : '&nbsp;'
			return html2Element(html)
		}
		case 'boolean': return accessor
	}

	const keyWords = '(' + filterValue.trim().toLowerCase().split(/\s+/g).sort(
		(prev, next) => next.length - prev.length 
	).join('|') + ')'

	return rowData => {
		const value = accessor(rowData)
		if (typeof value === 'object') return value
		const html = (value === 0 || value) ? value.toString().replace(new RegExp(keyWords, 'ig'), `<span class="it-highlight">$1</span>`) : '&nbsp;'
		const element = html2Element(html)
		return element || ''
	}
}

export default class Filter {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance

		this.renderTextControl = renderTextControl.bind(this)
		this.renderNumberControl = renderNumberControl.bind(this)
		this.renderSelectControl = renderSelectControl.bind(this)
		this.renderDateControl = renderDateControl.bind(this)
		this.renderCheckControl = renderCheckControl.bind(this)

		const { state } = this.tableInstance

		const filterable = getType(options.filter) === 'object'
		
		if (filterable) {
			const { filterAll, filterOpen, openAction } = options.filter

			state.filter = {
				filterAll: filterAll === true, // 设置是否默认所有列都添加筛选
				filterOpen: filterOpen === true,
				openAction: openAction !== false,
				filterable
			}
		} else {
			state.filter = {
				filterable
			}
		}

		this.state = state.filter
	}

	afterContruct () {
		this.globalState = this.tableInstance.state
	}

	shouldUse () {
		return this.state.filterable
	}

	beforeCreate () {
		const { columnProps } = this.tableInstance
		const { filterAll } = this.state

		for (let i in columnProps) {
			const props = columnProps[i]
			const { filterable, filter, filterOptions } = props

			if (filterAll || filterable) {
				if (getType(filter) === 'function') {
					props.filter = filter
					props.filterable = true
				} else if ((filterAll && filterable !== false) || filterable === true) {
					props.filter = (filterOptions && filterOptions.type === 'number') ? defaultNumberFilter : defaultTextFilter
					props.filterable = true
				} else {
					props.filter = null
					props.filterable = false
				}
			}
		}
	}

	create () {
		const { filterAll, filterOpen, openAction } = this.state
		const { table, columnProps } = this.tableInstance
		const tbodyGroup = table.querySelector('.it-tbody-group')

		const filterGroup = theadTemp.cloneNode()
		filterGroup.classList.add('filter', 'resize')

		const tr = trTemp.cloneNode()

		for (let i in columnProps) {
			const props = columnProps[i]
			const { width, filterable, accessor, id, className } = props
			const th = thTemp.cloneNode()
			th.style.cssText = `flex: ${width} 0 auto; width: ${width}px`

			if (getType(className) === 'string') {
				th.classList.add(className)
			}

			if ((filterAll && filterable !== false) || filterable) {
				const options = props.filterOptions || { type: 'text' }
				let filterControl = null

				switch (options.type) {
					case 'text': {
						filterControl = this.renderTextControl(id)
						break
					}
					case 'number': {
						filterControl = this.renderNumberControl(id)
						break
					}
					case 'select': {
						filterControl = this.renderSelectControl(id)
						break
					}
					case 'date': {
						filterControl = this.renderDateControl(id)
						break
					}
					case 'check': {
						filterControl = this.renderCheckControl(id)
						break
					}
					default: {
						throw new Error(`You may be lost 'type' in your filterOption.`)
					}
				}

				th.appendChild(filterControl)				
			} else {
				th.innerHTML = '&nbsp;'
			}
			// 原始读取器
			props.reflectAccessor = accessor
			tr.appendChild(th)
		}
		filterGroup.appendChild(tr)

		if (openAction) {
			const action = temp.cloneNode()
			action.className = 'it-filter-action'
			const arrow = spanTemp.cloneNode()
			arrow.textContent = '≡'
			arrow.className = 'it-arrow'
			action.appendChild(arrow)

			if (filterOpen) {
				action.classList.add('open')
				tr.classList.add('open')
				filterGroup.style.zIndex = 1
			}

			action.addEventListener('click', () => {
				if (action.classList.contains('open')) {
					action.classList.remove('open')
					tr.classList.remove('open')
					filterGroup.style.zIndex = ''

					this.state.filterOpen = false
				} else {
					action.classList.add('open')
					tr.classList.add('open')

					setTimeout(() => {
						filterGroup.style.zIndex = 1
					}, 300)

					this.state.filterOpen = true
				}
			})

			filterGroup.appendChild(action)
		} else {
			tr.classList.add('no-action')
			filterGroup.style.zIndex = 1
		}

		tbodyGroup.parentNode.insertBefore(filterGroup, tbodyGroup)
		this.created = true
	}

	beforeRenderData (data) {
		if (!this.created) return
		if (!this.filterValueChange) return this.filterData
		
		const { columnProps } = this.tableInstance
		let filterData = data
		let resultCount = 0

		for (let props of columnProps) {
			const { filterable, filter, filterValue, reflectAccessor } = props
			props.accessor = reflectAccessor

			if (filterable && filter && filterValue) {
				if (typeof filterValue === 'object' && typeof filterValue[0] !== 'number' && typeof filterValue[1] !== 'number') {
					continue
				}

				const resultData = []

				for (let i in filterData) {
					const rowData = filterData[i];
					const value = reflectAccessor(rowData)

					if (filter(value, filterValue)) {
						resultData.push(rowData);
						resultCount++
					}
				}

				filterData = resultData

				if (resultCount) {
					props.accessor = getPorxyAccessor(reflectAccessor, filterValue)
				}
			}
		}	

		this.filterData = filterData
		this.filterValueChange = false

		return filterData
	}

	dispatchChange() {
		this.filterValueChange = true
	}
}
