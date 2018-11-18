/**
 *	@name selector
 *	@description 表格数据选择 (复选框)
 */

import { table, state } from 'core/status';
import { getUuid } from '@/utils';
import { inputTemp } from 'core/temps';
import { renderBodyData } from 'core/render';

import './style.scss';

const selectionRecorder = {};
const checkboxRecorder = {};

const checkboxTemp = inputTemp.cloneNode();
checkboxTemp.setAttribute('type', 'checkbox');
checkboxTemp.className = 'it-check';

export default class {
	constructor(target) {
		this.target = target;
	}
	shouldUse(state) {
		return state.useSelector;
	}
	beforeInit(options) {
		const target = this.target;
		const { useSelector } = options;
		if (useSelector !== true) return;
		const { data } = table[target];
		for (let rowData of data) {
			rowData._itId = getUuid();
		}
		const selection = [];
		selectionRecorder[target] = selection;
		checkboxRecorder[target] = {};
		const columns = table[target].columns;

		const headCheck = checkboxTemp.cloneNode();

		const selector = {
			name: headCheck,
			accessor: data => {
				const uuid = data._itId;
				if (!uuid) return;
				const recorder = checkboxRecorder[target];
				let rowCheck = null;
				if (recorder[uuid]) {
					rowCheck = recorder[uuid].target;
				} else {
					rowCheck = checkboxTemp.cloneNode();
					recorder[uuid] = {
						target: rowCheck,
						rowData: data,
					};
					rowCheck.addEventListener('change', function() {
						if (rowCheck.checked) {
							selection.push(uuid);
						} else {
							const index = selection.indexOf(uuid);
							if (index !== -1) selection.splice(index, 1);
						}
					});
					rowCheck._itId = uuid;
				}
				return rowCheck;
			},
			resizer: false,
			sorter: false,
			filter: (value, filter) => {
				const selected = selection.includes(value._itId);
				return filter? selected: true;
			},
			filterOptions: {
				type: 'check',
			},
			defaultWidth: 32,
		};

		const children = columns[0].children;
		if (children && children.length) {
			children.unshift(selector);
		} else {
			columns.unshift(selector);
		}
		state[target].useSelector = useSelector;
	}
	create() {
		this.created = true;
	}
	bindEvent() {
		const target = this.target;
		const iTable = table[target].target;
		const headCheck = iTable.querySelector('.it-thead.shadow .it-check');

		let type = 0;
		const recorder = checkboxRecorder[target];
		const selection = selectionRecorder[target];

		const filter = table[target].plugins && table[target].plugins.filter;
		
		headCheck.addEventListener('change', function(ev) {
			ev.stopPropagation();
			type = +!type;
			if (type && selection.length) type = 2;
			selection.length = 0;
			for (let uuid in recorder) {
				const checkbox = recorder[uuid].target;
				switch (type) {
					case 0: checkbox.checked = false; break;
					case 1: checkbox.checked = true; selection.push(uuid); break;
					case 2: {
						checkbox.checked = !checkbox.checked;
						if (checkbox.checked) selection.push(uuid);
						break;
					}
				}
			}
			headCheck.checked = !!type;
			selectionRecorder[target] = selection;
			if (filter) filter.dispatchChange();
			if (state[target].filterable) renderBodyData(target);
		});
	}
};