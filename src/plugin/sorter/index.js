/**
 *	@name sorter
 *	@description 表格数据排序
 */

import { table, state } from 'core/status';
import { temp } from 'core/temps';
import { renderBodyData } from 'core/render';
import { getKeyState } from 'core/events';
import { sortByProps, checkPathByClass } from '@/utils';

import './style.scss';

// 多列排序缓存
let sortCacheData = {};

function getPluralSortData(data) {
	const target = this.target;
	const { target: iTable, columnProps } = table[target];
	let { sortBy, sortType } = state[target];
	const sortHandlers = iTable.querySelectorAll('.it-sort');
	const optinos = sortBy.map(
		(value, index) => {
			const props = columnProps.find(cp => cp.id === value);
			const type = sortType[index] === 1? 'asc': 'des';
			const { accessor, sorter, index: key } = props;

			switch (sortType[index]) {
				case 1: sortHandlers[key].classList.add('asc'); break;
				case 2: sortHandlers[key].classList.add('des'); break;
			}

			return { type, accessor, sorter };
		}
	);
	return sortByProps(data, optinos);
};

const defaultSortMethod = (a, b) => a > b? 1: a < b? -1: 0;

export default class {
	constructor(target) {
		this.target = target;
		this.getSortData = getPluralSortData.bind(this);
	}
	shouldUse(state) {
		return state.sortable !== false;
	}
	beforeInit(options) {
		const target = this.target;
		const currentState = state[target];
		const { sortable, sortCache } = options;
		state[target] = {
			...currentState,
			sortable: sortable !== false,
			sortBy: [undefined],
			sortType: [0],			// 0 normal | 1 asc | 2 des
			sortData: undefined,
			sortCache: sortCache === true,
		};
	}
	beforeRenderData(data) {
		const target = this.target;
		const { sortBy, sortCache } = state[target];
		if (typeof sortBy[0] !== 'undefined') {
			data = this.getSortData(data);
		}
		return data;
	}
	beforeCreate() {
		const target = this.target;
		const { columnProps, columns } = table[target];
		const sorters = [];
		for (let props of columnProps) {
			const { sorter } = props;
			props.sorter = sorter !== false? typeof value === 'function'? value: defaultSortMethod: false;
			// console.log({props});
		}
	}
	create() {
		const target = this.target;
		const iTable = table[target].target;
		const ths = iTable.querySelectorAll('.it-thead.shadow .it-th');

		for (let i = 0, len = ths.length; i < len; i++) {
			const th = ths[i];
			th.classList.add('it-sort');
		}

		if (state[target].sortCache) sortCacheData[target] = new Map();
		this.created = true;
	}
	bindEvent() {
		const key = this.target;
		const { target: iTable, columnProps } = table[key];

		iTable.addEventListener('click', function(ev) {
			const thisState = state[key];
			if (thisState.resizing) return;
			const evt = ev || event;

			const path = evt.path;
			let target = null;
			if (path) {
				target = path.find(value => value.classList && value.classList.contains('it-sort'));
			} else {
				target = evt.target || evt.srcElement;
				target = checkPathByClass(target, 'it-sort');
			}

			if (target) {
				// console.time('sort');
				const id = target.itColumnId;
				if (!id) return;
				const props = columnProps.find(value => value.id === id);
				const { sorter } = props;

				if (sorter) {
					let { sortBy, sortType } = thisState;
					
					if (
						typeof sortBy[0] !== 'undefined'
						&&
						(sortBy.length !== 1 || sortBy[0] !== id)
						&&
						getKeyState('shift')
					) {
						const targetIndex = sortBy.findIndex(value => value === id);
						let sortIndex = 0;
						if (targetIndex !== -1) {
							sortIndex = targetIndex;
							sortType[sortIndex] = (sortType[sortIndex] + 1) % 3;
							if (!sortType[sortIndex]) {
								sortBy.splice(sortIndex, 1);
								sortType.splice(sortIndex, 1);
								target.classList.remove('asc', 'des');
							}
						} else {
							sortIndex = sortBy.push(id) - 1;
							sortType[sortIndex] = 1;
						}
					} else {
						if (sortBy.length > 1 || sortBy[0] !== id) {
							thisState.sortBy = [id];
							thisState.sortType = [0];
						}

						iTable.querySelectorAll('.asc, .des').forEach(
							value => value.classList.remove('asc', 'des')
						);
						sortBy = thisState.sortBy;
						sortType = thisState.sortType;
						sortType[0] = (sortType[0] + 1) % 3;

						if (!sortType[0]) {
							sortBy[0] = undefined;
						} else {
							switch (sortType[0]) {
								case 1: target.classList.add('asc'); break;
								case 2: target.classList.add('des'); break;
							}
						}
					}

					renderBodyData(key);
				}
				// console.timeEnd('sort');
			}
		});
	}
}