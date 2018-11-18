/**
 *	@name resizer
 *	@description 调整表格大小插件
 */

import { table, state } from 'core/status';
import { temp } from 'core/temps';
import { defaultColumnWidth } from 'core/render';

import './style.scss';

// 控制列宽代理控制器
function getProxyHandler(target) {
	return {
		set: function(obj, prop, value) {
			const old = obj[prop];
			if (typeof old !== 'undefined' && old !== value) {
				console.log(
					`%cResizer%c >> column %c${prop}%c width change from %c${old}%c to %c${value}`,
					'color: #fff; font-weight: 700; background: #2d8cf0; padding: 0 .3em',
					'font-weight: 700',
					'color: #fff; font-weight: 700; background: #ed4014; padding: 0 .3em',
					'font-weight: 700',
					'color: #fff; font-weight: 700; background: #ff9900; padding: 0 .3em',
					'font-weight: 700',
					'color: #fff; font-weight: 700; background: #19be6b; padding: 0 .3em',
				);
				obj[prop] = value;
				renderResize(target, prop, old);
			} else {
				obj[prop] = value;
			}
			return true;
		}
	};
}

function renderResize(target, index, currentWidth) {
	const { target: iTable, columnProps } = table[target];
	const nthOfType = +index + 1;
	const columnWidth = state[target].columnWidth;
	const targetWidth = columnWidth[index];
	const props = columnProps[+index];
	props.width = targetWidth;

	const theads = iTable.querySelectorAll('.it-thead, .it-tbody-group, .it-tfoot');
	const childThs = iTable.querySelectorAll(`.it-thead.resize .it-th:nth-of-type(${nthOfType})`);
	const tbodyTds = iTable.querySelectorAll(`
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

export default class {
	constructor(target) {
		this.target = target;
	}
	shouldUse(state) {
		return state.resizable;
	}
	beforeInit(options) {
		const target = this.target;
		const currentState = state[target];
		const resizable = options.resizable;
			
		state[target] = {
			...currentState,
			columnWidth: new Proxy({}, getProxyHandler(target)),
			resizable: resizable !== false,
			resizing: false,
		};
	}
	create() {
		const target = this.target;
		const { target: iTable, columnProps } = table[target];
		const { columnWidth } = state[target];
		const thead = iTable.querySelector('.it-thead.shadow');
		thead.classList.add('resize');
		const ths = thead.querySelectorAll('.it-thead.shadow .it-th');

		for (let i = 0, len = ths.length; i < len; i++) {
			const th = ths[i];
			const id = th.itColumnId;
			if (!id) return;
			const props = columnProps.find(value => value.id === id);
			if (props.resizer !== false) {
				const resizer = temp.cloneNode();
				resizer.className = 'it-resizer';
				resizer.itColumnIndex = i;
				th.classList.add('it-resize');
				th.appendChild(resizer);
				th.itResize = false;
			} else {
				columnWidth[i.toString()] = 0;
			}

			columnWidth[i.toString()] = parseFloat(th.style.width) || defaultColumnWidth;
		}
		this.created = true;
	}
	bindEvent() {
		const key = this.target;
		const iTable = table[key].target;
		const thisState = state[key];
		const handler = temp.cloneNode();
		handler.className = 'it-resize-handler';

		let index = 0, start = 0, end = 0;
		function handlerMove(ev) {
			const evt = ev || event;
			const tableRect = iTable.getBoundingClientRect();
			end = evt.clientX - tableRect.left;
			handler.style.left = `${end}px`;
			return false;
		}

		function resizeFinish() {
			const column = iTable.querySelectorAll('.it-thead.shadow .it-th')[index];
			const columnRect = column.getBoundingClientRect();

			const currentWidth = columnRect.width;
			const targetWidth = (currentWidth + end - start);

			thisState.columnWidth[index.toString()] = targetWidth;
			iTable.removeChild(handler);
			start = 0;
			end = 0;
			document.removeEventListener('mousemove', handlerMove);
			document.removeEventListener('mouseup', resizeFinish);
			// 延迟100ms保证防止触发排序器
			setTimeout(function() {
				thisState.resizing = false;
			}, 100);
		}

		iTable.addEventListener('mousedown', function(ev) {
			const evt = ev || event;
			const target = evt.target || evt.srcElement;
			if (target.classList.contains('it-resizer')) {
				thisState.resizing = true;
				index = target.itColumnIndex;
				const 
					tableRect = iTable.getBoundingClientRect(),
					resizerRect = target.getBoundingClientRect();
				start = resizerRect.left - tableRect.left + 13;
				end = start;
				handler.style.left = `${start}px`;
				iTable.appendChild(handler);

				document.addEventListener('mousemove', handlerMove);
				document.addEventListener('mouseup', resizeFinish);
			}
		});
	}
}