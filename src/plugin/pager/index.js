/**
 *	@name pager
 *	@description 表格数据分页
 */

import {
	temp,
	spanTemp,
	buttonTemp,
	inputTemp
} from 'core/temps'
import { toggleDisabled, createSelect } from '@/utils'

import './style.scss'

function getIndexRange({ currentPage, pageSize }) {
	const startIndex = (currentPage - 1) * pageSize || 0
	const endIndex = currentPage * pageSize
	return { startIndex, endIndex }
}

function renderPagination() {
	const { data } = this.tableInstance
	const { pageOption, currentPage, pageSize, usePageOption, currentOption } = this.state

	const wrapper = temp.cloneNode()
	wrapper.className = 'it-pagination'

	const prev = temp.cloneNode()
	const center = temp.cloneNode()
	const next = temp.cloneNode()

	prev.className = 'it-prev'
	center.className = 'it-info'
	next.className = 'it-next'

	// 页码控件
	const page = spanTemp.cloneNode()
	page.className = 'it-page'
	const input = inputTemp.cloneNode()
	input.setAttribute('type', 'number')
	input.className = 'it-input'
	input.value = currentPage

	// 翻页控件
	const prevButton = buttonTemp.cloneNode()
	const nextButton = buttonTemp.cloneNode()

	prevButton.textContent = '上一页'
	prevButton.setAttribute('disabled', '')
	prevButton.addEventListener('click', () => {
		if (prevButton.getAttribute('disabled')) {
			return false
		}
		this.changePage(--input.value)
		// changButtonState();
	})
	this.prevButton = prevButton

	nextButton.textContent = '下一页';
	nextButton.addEventListener('click', () => {
		if (nextButton.getAttribute('disabled')) {
			return false
		}
		this.changePage(++input.value)
	})

	this.nextButton = nextButton;

	prev.appendChild(prevButton)
	next.appendChild(nextButton)

	// 控制页码范围
	input.addEventListener('input', () => {
		const { pageSize } = thisState
		const maxPage = Math.ceil(this.dataTotal / pageSize) || 1
		const targetPage = input.value
		input.value = targetPage < 1? 1: targetPage > maxPage? maxPage: targetPage
	});

	// 跳转到对应页面
	input.addEventListener('blur', () => {
		const targetPage = input.value
		const { currentPage } = thisState
		if (targetPage === currentPage) return
		this.changePage(targetPage)
		// changButtonState();
	})

	// 总页数记录
	const totalPage = spanTemp.cloneNode()
	totalPage.textContent = ' / ' + (Math.ceil(data.length / pageSize) || 1)
	this.totalPage = totalPage
	page.appendChild(input)
	page.appendChild(totalPage)
	center.appendChild(page)

	// 分页控件
	if (usePageOption) {
		const sizeSelect = spanTemp.cloneNode()
		sizeSelect.className = 'it-size-select'
		const select = createSelect(pageOption.map(value => ({ title: `${value} 行`, value })), currentOption)

		select.addEventListener('change', ev => {
			// 分页改变
			const targetSize = +ev.newValue
			const { pageSize, currentPage } = this.state
			// const tbody =  table[target].target.querySelector('.it-tbody');
			const dataIndex = (currentPage - 1) * pageSize + 1

			// 重新计算页码数
			const computedCurrentPage = Math.ceil(dataIndex / targetSize)
			input.value = computedCurrentPage
			totalPage.textContent = ' / ' + (Math.ceil(data.length / targetSize) || 1)
			this.state.pageSize = targetSize
			this.state.currentPage = computedCurrentPage

			// 调整表格结构
			this.tableInstance.renderBodyStruct()

			// 重填数据
			this.tableInstance.renderBodyData()		
		})

		sizeSelect.appendChild(select)
		center.appendChild(sizeSelect)
	}

	wrapper.appendChild(prev)
	wrapper.appendChild(center)
	wrapper.appendChild(next)

	return wrapper
}

function changePage(targetPage) {
	targetPage = targetPage > 0? targetPage: 1

	this.state.currentPage = targetPage
	this.tableInstance.renderBodyData()
}

export default class Pager {
	constructor(tableInstance, options) {
		this.tableInstance = tableInstance
		
		this.changePage = changePage.bind(this)
		this.renderTraget = renderPagination.bind(this)

		const { pageable, usePageOption, pageSize, currentPage, currentPageOption } = options
		const pageOption = options.pageOption || [10, 20, 50, 100]
		const currentOption = currentPageOption ? pageOption[options.currentPageOption] : pageOption[0]

		this.tableInstance.state = {
			...this.tableInstance.state,
			pageable: pageable !== false,
			currentPage: currentPage || 1,
			pageOption,
			pageSize: usePageOption === false? (pageSize || 10): currentOption,
			currentOption: currentPageOption || 0,
			usePageOption: usePageOption !== false,
		}
	}

	afterContruct () {
		this.state = this.tableInstance.state
	}

	shouldUse () {
		return this.state.pageable !== false
	}

	beforeRenderBody () {
		return this.state.pageSize
	}

	beforeRenderData (data) {
		const { startIndex, endIndex } = getIndexRange(this.state)

		this.dataTotal = data.length || 0
		this.computeTotalPage()

		if (this.created) {
			this.changButtonState()
		}

		return data.slice(startIndex, endIndex)
	}

	create () {
		const pagination = temp.cloneNode()
		pagination.className = 'it-bottom'
		pagination.appendChild(this.renderTraget())
		
		if (this.tableInstance.table) {
			this.tableInstance.table.appendChild(pagination)
		}
		
		this.created = true
	}

	changButtonState () {
		const { startIndex, endIndex } = getIndexRange(this.state)
		// console.log({ startIndex, endIndex, total: this.dataTotal });
		toggleDisabled(this.prevButton, startIndex <= 0)
		toggleDisabled(this.nextButton, endIndex >= this.dataTotal)
	}

	getPageInfo () {
		const { currentPage, pageSize } = this.state
		return { currentPage, pageSize }
	}

	computeTotalPage () {
		const { dataTotal, totalPage } = this
		const { pageSize } = this.state
		
		if (totalPage) {
			totalPage.textContent = ' / ' + (Math.ceil(dataTotal / pageSize) || 1)
		}
	}
}
