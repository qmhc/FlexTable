/**
 *	@name pager
 *	@description 表格数据分页
 */

import { table, state } from 'core/status';
import {
	temp,
	spanTemp,
	buttonTemp,
	inputTemp,
} from 'core/temps';
import { renderBodyData, renderBodyStruct } from 'core/render';
import { toggleDisabled, createSelect } from '@/utils';

import './style.scss';

function getIndexRange({currentPage, pageSize}) {
	const startIndex = (currentPage - 1) * pageSize || 0;
	const endIndex = currentPage * pageSize;
	return { startIndex, endIndex };
}

function renderPagination() {
	const _this = this;
	const target = _this.target;
	const { data } = table[target];
	const thisState = state[target];
	const { pageOption, currentPage, pageSize, usePageOption } = thisState;

	const wrapper = temp.cloneNode();
	wrapper.className = 'it-pagination';

	const
		prev = temp.cloneNode(),
		center = temp.cloneNode(),
		next = temp.cloneNode();

	prev.className = 'it-prev';
	center.className = 'it-info';
	next.className = 'it-next';

	// 页码控件
	const page = spanTemp.cloneNode();
	page.className = 'it-page';
	const input = inputTemp.cloneNode();
	input.setAttribute('type', 'number');
	input.className = 'it-input';
	input.value = currentPage;

	// 翻页控件
	const
		prevButton = buttonTemp.cloneNode(),
		nextButton = buttonTemp.cloneNode();

	prevButton.textContent = '上一页';
	prevButton.setAttribute('disabled', '');
	prevButton.addEventListener('click', function() {
		if (prevButton.getAttribute('disabled')) return;
		_this.changePage(--input.value);
		// changButtonState();
	});
	this.prevButton = prevButton;

	nextButton.textContent = '下一页';
	nextButton.addEventListener('click', function() {
		if (nextButton.getAttribute('disabled')) return;
		_this.changePage(++input.value);
		// changButtonState();
	});
	this.nextButton = nextButton;

	prev.appendChild(prevButton);
	next.appendChild(nextButton);

	// 控制页码范围
	input.addEventListener('input', () => {
		const { pageSize } = thisState;
		const maxPage = Math.ceil(this.dataTotal / pageSize) || 1;
		const targetPage = input.value;
		input.value = targetPage < 1? 1: targetPage > maxPage? maxPage: targetPage;
	});

	// 跳转到对应页面
	input.addEventListener('blur', function() {
		const targetPage = input.value;
		const { currentPage } = thisState;
		if (targetPage === currentPage) return;
		_this.changePage(targetPage);
		// changButtonState();
	});

	// 总页数记录
	const totalPage = spanTemp.cloneNode();
	totalPage.textContent = ' / ' + (Math.ceil(data.length / pageSize) || 1);
	this.totalPage = totalPage;
	page.appendChild(input);
	page.appendChild(totalPage);
	center.appendChild(page);

	// 分页控件
	if (usePageOption) {
		const sizeSelect = spanTemp.cloneNode();
		sizeSelect.className = 'it-size-select';
		const select = createSelect(pageOption.map(value => ({title: `${value} 行`, value })), 0);
		select.addEventListener('change', function(ev) {
			// 分页改变
			const targetSize = +ev.newValue;
			const { pageSize, currentPage } = thisState;
			const tbody =  table[target].target.querySelector('.it-tbody');
			const dataIndex = (currentPage - 1) * pageSize + 1;

			// 重新计算页码数
			const computedCurrentPage = Math.ceil(dataIndex / targetSize);
			input.value = computedCurrentPage;
			totalPage.textContent = ' / ' + (Math.ceil(data.length / targetSize) || 1);
			thisState.pageSize = targetSize;
			thisState.currentPage = computedCurrentPage;

			// 调整表格结构
			renderBodyStruct(target);

			// 重填数据
			renderBodyData(target);			
		});
		sizeSelect.appendChild(select);
		center.appendChild(sizeSelect);
	}

	wrapper.appendChild(prev);
	wrapper.appendChild(center);
	wrapper.appendChild(next);

	return wrapper;
}

function changePage(targetPage) {
	const target = this.target;
	const { target: iTable, data } = table[target];
	const { pageSize, currentPage, columnWidth } = state[target];

	const tbody = iTable.querySelector('.it-tbody');

	targetPage = targetPage > 0? targetPage: 1;

	state[target].currentPage = targetPage;
	renderBodyData(target);
}

export default class {
	constructor(target) {
		this.target = target;
		this.changePage = changePage.bind(this);
		this.renderTraget = renderPagination.bind(this);
	}
	shouldUse(state) {
		return state.pageable !== false;
	}
	beforeInit(options) {
		const target = this.target;
		const currentState = state[target];
		const { pageable, usePageOption, pageSize } = options;
		const pageOption = options.pageOption || [10, 20, 50, 100];
		state[target] = {
			...currentState,
			pageable: pageable !== false,
			currentPage: 1,
			pageOption,
			pageSize: usePageOption === false? (pageSize || 10): pageOption[0],
			usePageOption: usePageOption !== false,
		};
	}
	beforeRenderBody(rowsCount) {
		return state[this.target].pageSize;
	}
	beforeRenderData(data) {
		const { startIndex, endIndex } = getIndexRange(state[this.target]);
		this.dataTotal = data.length || 0;
		this.computeTotalPage();
		if (this.created) this.changButtonState();
		return data.slice(startIndex, endIndex);
	}
	create() {
		const target = this.target;	
		const pagination = temp.cloneNode();
		pagination.className = 'it-bottom';
		pagination.appendChild(this.renderTraget(target));
		table[target].target.appendChild(pagination);
		this.created = true;
	}
	changButtonState() {
		const target = this.target;
		const { startIndex, endIndex } = getIndexRange(state[target]);
		// console.log({ startIndex, endIndex, total: this.dataTotal });
		toggleDisabled(this.prevButton, startIndex <= 0);
		toggleDisabled(this.nextButton, endIndex >= this.dataTotal);
	};
	getPageInfo() {
		const { currentPage, pageSize } = state[this.target];
		return { currentPage, pageSize };
	}
	computeTotalPage() {
		const { target, dataTotal, totalPage } = this;
		const { pageSize } = state[target];
		if (totalPage) totalPage.textContent = ' / ' + (Math.ceil(dataTotal / pageSize) || 1);
	}
}