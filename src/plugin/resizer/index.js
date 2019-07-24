/**
 *	@name resizer
 *	@description 调整表格大小插件
 */

import { temp } from 'core/temps'

import './style.scss'

// 控制列宽代理控制器
function getProxyHandler() {
	const _this = this
	return {
		set (obj, prop, value) {
			const old = obj[prop];
			if (typeof old !== 'undefined' && old !== value) {
				// console.log(
				// 	`%cResizer%c >> column %c${prop}%c width change from %c${old}%c to %c${value}`,
				// 	'color: #fff; font-weight: 700; background: #2d8cf0; padding: 0 .3em',
				// 	'font-weight: 700',
				// 	'color: #fff; font-weight: 700; background: #ed4014; padding: 0 .3em',
				// 	'font-weight: 700',
				// 	'color: #fff; font-weight: 700; background: #ff9900; padding: 0 .3em',
				// 	'font-weight: 700',
				// 	'color: #fff; font-weight: 700; background: #19be6b; padding: 0 .3em',
				// );
				obj[prop] = value
				renderResize.apply(_this, [prop, old])
			} else {
				obj[prop] = value
			}
			return true
		}
	}
}

function renderResize(index) {
	const { table, columnProps } = this.tableInstance
	const nthOfType = +index + 1;
	const columnWidth = this.state.columnWidth;
	const targetWidth = columnWidth[index];
	const props = columnProps[+index];
	props.width = targetWidth;

	const theads = table.querySelectorAll('.it-thead, .it-tbody-group, .it-tfoot');
	const childThs = table.querySelectorAll(`.it-thead.resize .it-th:nth-of-type(${nthOfType})`);
	const tbodyTds = table.querySelectorAll(`
		.it-tbody .it-tr>.it-td:nth-of-type(${nthOfType}),
		.it-tfoot .it-tr>.it-td:nth-of-type(${nthOfType})
	`);
	const groupTh = props.parentTarget;

	let tableWidth = 0;
	for (let key in columnWidth) {
		const width = columnWidth[key];
		tableWidth += width;
	}
	for (let i = 0, len = theads.length; i < len; i++) {
		const thead = theads[i];
		thead.style.minWidth = `${tableWidth}px`;
	}

	// 用于保持两层表头结构 (flex布局) 一致性
	if (!childThs[0].itResize) {
		childThs[0].itResize = true;
		if (groupTh) groupTh.itChildrenSize--;
	}

	if (groupTh) {
		const { itChildrenIds, itChildrenSize } = groupTh;
		let width = 0;
		for (let id of itChildrenIds) {
			width += columnProps.find(props => props.id === id).width;
		}
		groupTh.style.cssText = `flex: ${itChildrenSize * 100} 0 auto; width: ${width}px`;
	}		
	for (let i = 0, len = childThs.length; i < len; i++) {
		childThs[i].style.cssText = `flex: ${targetWidth} 0 auto; width: ${targetWidth}px; max-width: ${targetWidth}px`;
	}
	
	for (let i = 0, len = tbodyTds.length; i < len; i++) {
		const td = tbodyTds[i];
		td.style.cssText = `flex: ${targetWidth} 0 auto; width: ${targetWidth}px; max-width: ${targetWidth}px`;
	}
}

export default class Resizer {
	constructor(tableInstance, options) {
		this.tableInstance = tableInstance
		this.defaultColumnWidth = this.tableInstance.constructor.defaultColumnWidth

		const resizable = options.resizable
			
		this.tableInstance.state = {
			...this.tableInstance.state,
			columnWidth: new Proxy({}, getProxyHandler.call(this)),
			resizable: resizable !== false,
			resizing: false
		}
	}

	afterContruct () {
		this.state = this.tableInstance.state
	}

	shouldUse () {
		return this.state.resizable
	}

	create() {
		const { table, columnProps } = this.tableInstance
		const { columnWidth } = this.state

		const thead = table.querySelector('.it-thead.shadow')
		thead.classList.add('resize')

		const ths = thead.querySelectorAll('.it-thead.shadow .it-th')

		for (let i = 0, len = ths.length; i < len; i++) {
			const th = ths[i]
			const id = th.itColumnId

			if (!id) {
				return false
			}

			const props = columnProps.find(value => value.id === id)

			if (props.resizable !== false) {
				const resizer = temp.cloneNode()
				resizer.className = 'it-resizer'
				resizer.itColumnIndex = i
				th.classList.add('it-resize')
				th.appendChild(resizer)
				th.itResize = false
			} else {
				columnWidth[i.toString()] = 0
			}

			columnWidth[i.toString()] = parseFloat(th.style.width) || this.defaultColumnWidth
		}

		this.created = true
	}

	bindEvent () {
		const table = this.tableInstance.table
		const handler = temp.cloneNode()
		handler.className = 'it-resize-handler'

		let index = 0
		let start = 0
		let end = 0

		const handlerMove = ev => {
			const evt = ev || event
			const tableRect = table.getBoundingClientRect()
			end = evt.clientX - tableRect.left
			handler.style.left = `${end}px`
			return false
		}

		const resizeFinish = () => {
			const column = table.querySelectorAll('.it-thead.shadow .it-th')[index]
			const columnRect = column.getBoundingClientRect()

			const currentWidth = columnRect.width;
			const targetWidth = (currentWidth + end - start)

			this.state.columnWidth[index.toString()] = targetWidth
			table.removeChild(handler)
			start = 0
			end = 0

			document.removeEventListener('mousemove', handlerMove)
			document.removeEventListener('mouseup', resizeFinish)

			// 延迟100ms保证防止触发排序器
			setTimeout(() => {
				this.state.resizing = false
			}, 200)
		}

		table.addEventListener('mousedown', ev => {
			const evt = ev || event
			const target = evt.target || evt.srcElement

			if (target.classList.contains('it-resizer')) {
				this.state.resizing = true
				index = target.itColumnIndex

				const tableRect = table.getBoundingClientRect()
				const resizerRect = target.getBoundingClientRect()

				start = resizerRect.left - tableRect.left + 13
				end = start

				handler.style.left = `${start}px`
				table.appendChild(handler)

				document.addEventListener('mousemove', handlerMove)
				document.addEventListener('mouseup', resizeFinish)
			}
		})
	}
}
