/**
 *	@name filter
 *	@description 表格数据过滤
 */

import { table, state } from 'core/status';
import {
	temp,
	theadTemp,
	trTemp,
	thTemp,
	spanTemp,
	inputTemp,
} from 'core/temps';
import { renderBodyData } from 'core/render';
import { createSelect } from '@/utils';

import './style.scss';

const defaultTextFilter = (value, filter) => {
	const keyWords = filter.trim().toLowerCase().split(/\s+/g);
	value = value.toString().toLowerCase();

	for (let word of keyWords) {
		if (!value.includes(word)) return false;
	}
	return true;
};

const defaultNumberFilter = (value, filter) => {
	value = +value;
	if (Number.isNaN(value)) return false;
	const res = (
		(typeof filter[0] !== 'number' || value >= filter[0])
		&&
		(typeof filter[1] !== 'number' || value <= filter[1])
	);
	return res;
}

function getProps(target, id) {
	const { columnProps } = table[target];
	return columnProps.find(props => props.id === id);
}

function renderTextControl(id) {
	const target = this.target;
	const props = getProps(target, id);

	const control = temp.cloneNode();
	control.className = 'it-filter';
	const textInput = inputTemp.cloneNode();
	textInput.setAttribute('type', 'text');
	textInput.addEventListener('input', () => {
		const value = textInput.value;
		props.filterValue = value;
		this.filterValueChange = true;
		renderBodyData(target);
	});

	// let _value = '';
	// Reflect.defineProperty(props, 'filterValue', {
	// 	get() {
	// 		return _value;
	// 	},
	// 	set(newValue) {
	// 		if (_value !== newValue) {
	// 			textInput.value = newValue || '';
	// 			_value = newValue;
	// 		}			
	// 	},
	// 	enumerable : true,
	// 	configurable : true,
	// });

	control.appendChild(textInput);
	return control;
}

function renderNumberControl(id) {
	const target = this.target;
	const props = getProps(target, id);

	props.filterValue = new Array(2);
	const control = temp.cloneNode();
	control.className = 'it-filter';
	const minNumberInput = inputTemp.cloneNode();
	minNumberInput.setAttribute('type', 'number');
	minNumberInput.setAttribute('placeholder', 'min');
	minNumberInput.addEventListener('input', () => {
		const value = minNumberInput.value;
		props.filterValue[0] = +value || undefined;
		this.filterValueChange = true;
		renderBodyData(target);
	});
	const maxNumberInput = inputTemp.cloneNode();
	maxNumberInput.setAttribute('type', 'number');
	maxNumberInput.setAttribute('placeholder', 'max');
	maxNumberInput.addEventListener('input', () => {
		const value = maxNumberInput.value;
		props.filterValue[1] = +value || undefined;
		this.filterValueChange = true;
		renderBodyData(target);
	});
	control.appendChild(minNumberInput);
	control.appendChild(maxNumberInput);
	return control;
}

function renderSelectControl(id) {
	const target = this.target;
	const props = getProps(target, id);

	const { options } = props.filterOptions;
	options.unshift('');

	const control = temp.cloneNode();
	control.className = 'it-filter';
	const select = createSelect(options);
	select.addEventListener('change', ev => {
		const value = ev.newValue;
		props.filterValue = value;
		this.filterValueChange = true;
		renderBodyData(target);
	});
	control.appendChild(select);
	return control;
}

function renderCheckControl(id) {
	const target = this.target;
	const props = getProps(target, id);

	const control = temp.cloneNode();
	control.className = 'it-filter';

	const checkbox = inputTemp.cloneNode();
	checkbox.setAttribute('type', 'checkbox');
	checkbox.addEventListener('change', () => {
		const checked = checkbox.checked;
		props.filterValue = checked;
		this.filterValueChange = true;
		renderBodyData(target);
	});

	control.appendChild(checkbox);
	return control;
}

function getPorxyAccessor(accessor, filterValue) {
	switch (typeof filterValue) {
		case 'object': return rowData => {
			const value = accessor(rowData);
			return value && `<span class="it-highlight">${value}</span>`
		};
		case 'boolean': return accessor;
	}
	const keyWords = '(' + filterValue.trim().toLowerCase().split(/\s+/g).sort(
		(prev, next) => next.length - prev.length 
	).join('|') + ')';
	return rowData => {
		const value = accessor(rowData);
		if (typeof value === 'object') return value;
		return value && value.toString().replace(new RegExp(keyWords, 'ig'), `<span class="it-highlight">$1</span>`);
	};
}

export default class {
	constructor(target) {
		this.target = target;
		this.renderTextControl = renderTextControl.bind(this);
		this.renderNumberControl = renderNumberControl.bind(this);
		this.renderSelectControl = renderSelectControl.bind(this);
		this.renderCheckControl = renderCheckControl.bind(this);
	}
	shouldUse(state) {
		return state.filterable;
	}
	beforeInit(options) {
		const target = this.target;
		const { columns, columnProps } = table[target];

		let { filterAll, filterOpen } = options;
		filterAll = filterAll === true;
		state[target] = {
			...state[target],
			filterAll,
			filterable: filterAll || columns.findIndex(
				column => 
					column.filter
					||
					(column.children && column.children.findIndex(
						column => column.filter
					) !== -1)
			) !== -1,
			filterOpen: filterOpen === true,
		};
	}
	beforeCreate() {
		const target = this.target;
		const { columnProps } = table[target];
		const { filterAll } = state[target];
		for (let i in columnProps) {
			const props = columnProps[i];
			const { filter, filterOptions } = props;
			if (filterAll || filter) {
				if (typeof filter === 'function') props.filter = filter;
				else if ((filterAll && filter !== false) || filter === true)
					props.filter = (filterOptions && filterOptions.type === 'number')? defaultNumberFilter: defaultTextFilter;
				else props.filter = false;
			}
		}
	}
	create() {
		const { target } = this;
		const thisState = state[target];
		const { filterAll, filterOpen } = thisState;
		const { target: iTable, columnProps, data } = table[target];
		const tbodyGroup = iTable.querySelector('.it-tbody-group');

		const filterGroup = theadTemp.cloneNode();
		filterGroup.classList.add('filter', 'resize');

		const tr = trTemp.cloneNode();
		for (let i in columnProps) {
			const props = columnProps[i];
			const { width, filter, accessor, id } = props;
			const th = thTemp.cloneNode();
			th.style.cssText = `flex: ${width} 0 auto; width: ${width}px`;
			if ((filterAll && filter !== false) || filter) {

				const options = props.filterOptions || { type: 'text' };
				let filterControl = null;
				switch (options.type) {
					case 'text': filterControl = this.renderTextControl(id); break;						
					case 'number': filterControl = this.renderNumberControl(id); break;
					case 'select': filterControl = this.renderSelectControl(id); break;
					case 'check': filterControl = this.renderCheckControl(id); break;
					default: throw new Error(`You may be lost 'type' in your filterOption.`);
				}
				th.appendChild(filterControl);				
			} else {
				th.innerHTML = '&nbsp;';
			}
			props.reflectAccessor = accessor;
			tr.appendChild(th);
		}
		filterGroup.appendChild(tr);

		const action = temp.cloneNode();
		action.className = 'it-filter-action';
		const arrow = spanTemp.cloneNode();
		arrow.textContent = '≡';
		arrow.className = 'it-arrow';
		action.appendChild(arrow);

		if (filterOpen) {
			action.classList.add('open');
			tr.classList.add('open');
			filterGroup.style.zIndex = 1;
		}

		action.addEventListener('click', function() {
			if (action.classList.contains('open')) {
				action.classList.remove('open');
				tr.classList.remove('open');
				filterGroup.style.zIndex = '';
				thisState.filterOpen = false;
			} else {
				action.classList.add('open');
				tr.classList.add('open');
				setTimeout(function() {
					filterGroup.style.zIndex = 1;
				}, 300);
				thisState.filterOpen = true;
			}
		});

		filterGroup.appendChild(action);

		tbodyGroup.parentNode.insertBefore(filterGroup, tbodyGroup);
		this.created = true;
	}
	beforeRenderData(data) {
		if (!this.created) return;
		if (!this.filterValueChange) return this.filterData;
		const target = this.target;
		const { columnProps } = table[target];
		let filterData = data;
		let resultCount = 0;
		for (let props of columnProps) {			
			const { filter, filterValue, reflectAccessor } = props;
			props.accessor = reflectAccessor;
			if (filter && filterValue) {
				if (
					typeof filterValue === 'object'
					&&
					typeof filterValue[0] !== 'number'
					&&
					typeof filterValue[1] !== 'number'
				)  continue;
				const resultData = [];
				for (let i in filterData) {
					const rowData = filterData[i];
					const value = reflectAccessor(rowData);
					if (filter(value, filterValue)) {
						resultData.push(rowData);
						resultCount++;
					}
				}
				filterData = resultData;

				if (resultCount) {
					props.accessor = getPorxyAccessor(reflectAccessor, filterValue)
				}
			}
		}	

		this.filterData = filterData;
		this.filterValueChange = false;

		return filterData;
	}
	dispatchChange() {
		this.filterValueChange = true;
	}
};