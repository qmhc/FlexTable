import { table, state } from './status';
import { 
	deepClone,
	toggleDisabled,
	createSelect,
	getUniqueArray,
	getUuid
} from '@/utils';
import {
	temp,
	buttonTemp,
	spanTemp,
	inputTemp,
	tableTemp,
	theadTemp,
	tbodyTemp,
	thTemp,
	trGroupTemp,
	trTemp,
	tdTemp,
} from './temps';

export const defaultColumnWidth = 100;

// 插件初始化
const plugins = [];
const pluginsConfig = require('../plugin/config');
const pluginFiles = require.context('../plugin', true, /^\.(\/|\\).+(\/|\\)index\.js$/);
const usePlugins = getUniqueArray(pluginsConfig.usePlugins);
pluginFiles.keys().forEach(
	key => {
		const name = key.substring(key.search(/(\/|\\)/) + 1, key.search(/(\/|\\)index\.js$/));
		const index = usePlugins.indexOf(name);
		if (index !== -1) {
			const plugin = pluginFiles(key).default;
			if (plugin && typeof plugin.prototype.shouldUse === 'function' && typeof plugin.prototype.create === 'function') {
				plugins[index] = { name, plugin };
			}
		}
	}
);

// 渲染主函数
export default function render(target, options) {
	state[target] = {};
	const thisPlugins = {};
	table[target].plugins = thisPlugins;

	// 插件实例化
	// beforeInit 钩子 (预处理)
	for (let i in plugins) {
		const plugin = new plugins[i].plugin(target);
		thisPlugins[plugins[i].name] = plugin;
		if (plugin.beforeInit) plugin.beforeInit(options);
	}

	// 表格结构生成
	const wrapper = temp.cloneNode();
	wrapper.className = 'iTable';
	table[target].target = wrapper;

	const iTable = tableTemp.cloneNode();
	wrapper.appendChild(iTable);

	const 
		theadGroup = theadTemp.cloneNode(),
		theadChild = theadTemp.cloneNode(),
		tbodyGroup = temp.cloneNode(),
		tbody = tbodyTemp.cloneNode();

	tbodyGroup.className = 'it-tbody-group';
	tbodyGroup.appendChild(tbody);

	const { groupTr, childTr } = renderHeader(target);

	const column = table[target].columnProps.length;
	const tableMinWidth = column * defaultColumnWidth;
	theadGroup.appendChild(groupTr);
	theadGroup.style.minWidth = `${tableMinWidth}px`;
	iTable.appendChild(theadGroup);

	if (childTr) {
		theadGroup.classList.add('group');
		theadChild.classList.add('shadow');
		theadChild.appendChild(childTr);
		theadChild.style.minWidth = `${tableMinWidth}px`;
		iTable.appendChild(theadChild);
	} else {
		theadGroup.classList.add('shadow');
	}

	iTable.appendChild(tbodyGroup);
	renderBodyStruct(target);
	renderBodyData(target);

	if (state[target].useFooter) {
		const tfootGroup = temp.cloneNode();
		tfootGroup.className = 'it-tfoot';
		tfootGroup.appendChild(renderFooter(target));
		iTable.appendChild(tfootGroup);
	}

	// 加载插件
	for (let name in thisPlugins) {
		const plugin = thisPlugins[name];
		const disabled = !plugin.shouldUse(state[target]);
		if (disabled) continue;
		if (plugin.beforeCreate) plugin.beforeCreate();
		plugin.create();
		if (plugin.bindEvent) plugin.bindEvent();
		if (plugin.afterCreate) plugin.afterCreate();
	}
}

function renderColumn(column) {
	const { name, accessor, footer, defaultWidth, children } = column;
	const id = column.id || getUuid();
	const th = thTemp.cloneNode();

	const content = temp.cloneNode();
	content.className = 'it-head-content';
	if (typeof name === 'string') {
		content.innerHTML = name;
	} else {
		content.appendChild(name);
	}

	th.appendChild(content);
	th.itColumnId = id;

	const width = defaultWidth || defaultColumnWidth;
	th.style.cssText = `flex: ${width} 0 auto; width: ${width}px`;

	return {
		...column,
		id,
		footer: typeof footer !== 'undefined'? typeof footer === 'function'? footer: () => footer: () => '&nbsp;',
		accessor: typeof accessor === 'function'? accessor: rowData => rowData[accessor],
		width,
		target: th,
		parent: !!(children && children.length),
		hasFooter: !!footer,
	};
}

function renderHeader(target) {
	const columns = table[target].columns;
	const record = [];
	let columnProps = [];
	let
		groupTr = trTemp.cloneNode(),
		childTr = trTemp.cloneNode();

	let count = 0, hasChilds = false, useFooter = false;
	for (let i in columns) {
		const column = columns[i];

		const props = renderColumn(column);
		columnProps.push(props);

		const groupTh = props.target;
		groupTr.appendChild(groupTh);

		if (props.parent) {
			hasChilds = true;
			const childrenIds = [];
			const { children } = column;
			let width = 0;
			for (let j in children) {
				const column = children[j];
				column.parentTarget = groupTh;
				const props = renderColumn(column);
				columnProps.push(props);

				const childTh = props.target;
				childTr.appendChild(childTh);
				width += props.width;
				childrenIds.push(props.id);
			}
			groupTh.style.cssText = `flex: ${width} 0 auto; width: ${width}px`;
			groupTh.itChildrenSize = children.length;
			groupTh.itChildrenIds = childrenIds;
		}
	}

	if (hasChilds) columnProps = columnProps.filter(props => !props.parent);

	for (let i in columnProps) {
		const props = columnProps[i];
		props.index = i;
		if (props.hasFooter) useFooter = true;
	}

	table[target].columnProps = columnProps;
	state[target].useFooter = useFooter;

	return { groupTr, childTr: hasChilds? childTr: null };
}

export function renderBodyStruct(target) {
	const { target: iTable, data, plugins, columnProps } = table[target];
	const fragment = document.createDocumentFragment();

	const afterHookFns = [];
	// beforeRenderBody 钩子 (表格结构变化)
	let length = data.length;
	for (let name in plugins) {
		const plugin = plugins[name];
		const disabled = !plugin.shouldUse(state[target]);
		if (!disabled && plugin.beforeRenderBody) {
			length = plugin.beforeRenderBody(length) || length;
		}
		if (plugin.afterRenderBody) {
			afterHookFns.unshift(plugin.afterRenderBody.bind(plugin));
		}
	}
	const tbody = iTable.querySelector('.it-tbody');
	const trGroups = tbody.querySelectorAll('.it-tr-group');

	if (trGroups.length) {
		// 结构变化
		const currentLength = trGroups.length;
		const groupTemp = trGroups[0];
		if (length > currentLength) {
			// 增加行数
			const count = length - currentLength;
			const groupTemp = tbody.querySelector('.it-tr-group:first-child');
			for (let i = 0; i < count; i++) {
				const group = groupTemp.cloneNode(true);
				fragment.appendChild(group);
			}
			tbody.appendChild(fragment);
		} else {
			// 减少行数
			const deleteTrGroups = tbody.querySelectorAll(`.it-tr-group:nth-child(n+${length + 1})`);
			for (let i = 0, len = deleteTrGroups.length; i < len; i++) {
				const trGroup = deleteTrGroups[i];
				tbody.removeChild(trGroup);
			}
		}
	} else {
		// 初始化渲染
		const ths = iTable.querySelectorAll('.it-thead.shadow .it-th');
		for (let i = 0; i < length; i++) {
			const rowData = data[i] || {};
			const group = trGroupTemp.cloneNode();
			const tr = trTemp.cloneNode();
			for (let j in columnProps) {
				const td = tdTemp.cloneNode();
				const width = parseFloat(ths[j].style.width);
				td.style.cssText = `flex: ${width} 0 auto; width: ${width}px`;
				tr.appendChild(td);
			}
			group.appendChild(tr);
			fragment.appendChild(group);
		}
		tbody.appendChild(fragment);
	}

	// afterRenderBody 钩子
	for (const callback of afterHookFns) callback(length);
}

// 渲染数据方法
export function renderBodyData(target) {
	const { target: iTable, sorters, plugins, columnProps } = table[target];
	const { sortBy, sortData } = state[target];

	const afterHookFns = [];
	// beforeRenderData 钩子
	const originData = table[target].data;
	let data = originData;
	for (let name in plugins) {
		const plugin = plugins[name];
		const disabled = !plugin.shouldUse(state[target]);
		if (!disabled && plugin.beforeRenderData) {
			data = plugin.beforeRenderData(data) || data;
		}
		if (plugin.afterRenderData) {
			afterHookFns.unshift(plugin.afterRenderData.bind(plugin));
		}
	}
	state[target].computedData = data || originData;

	const tbody = iTable.querySelector('.it-tbody');
	const trGroups = tbody.querySelectorAll('.it-tr-group');

	for (let i = 0, len = trGroups.length; i < len; i++) {
		const tr = trGroups[i].querySelector('.it-tr');
		const rowData = data[i] || {};
		const tds = tr.querySelectorAll('.it-td');
		for (let j in columnProps) {
			const { accessor } = columnProps[j];
			const td = tds[j];

			const result = accessor(rowData);
			const html = typeof result !== 'undefined'? result: '&nbsp;';
			if (typeof html !== 'object') {
				td.innerHTML = html;
			} else {
				td.innerHTML = '';
				td.appendChild(html);
			}
		}
	}

	// afterRenderData 钩子
	for (const callback of afterHookFns) callback(data);
}

function renderFooter(target) {
	const { target: iTable, data, columnProps } = table[target];
	const currentState = state[target];

	const columnData = new Map();
	for (let i in columnProps) {
		columnData.set(i, []);
	}

	for (let i in data) {
		const rowData = data[i];
		for (let j in columnProps) {
			const { accessor } = columnProps[j];
			columnData.get(j).push(accessor(rowData));
		}
	}
	
	const tr = trTemp.cloneNode();
	const ths = iTable.querySelectorAll('.it-thead.shadow .it-th');
	for (let i in columnProps) {
		const { footer, width } = columnProps[i];
		const td = tdTemp.cloneNode();
		td.style.cssText = `flex: ${width} 0 auto; width: ${width}px`;

		const content = temp.cloneNode();
		content.className = 'it-foot-content';

		const result = footer(columnData.get(i), {...currentState});
		const title = typeof result !== 'undefined'? result: '&nbsp;';

		if (typeof title !== 'object') {
			content.innerHTML = title;
		} else {
			content.appendChild(title);
		}

		td.appendChild(content);
		tr.appendChild(td);
	}
	return tr;
}