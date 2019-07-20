import { getUuid } from '@/utils'
import {
	temp,
	tableTemp,
	theadTemp,
	tbodyTemp,
	thTemp,
	trGroupTemp,
	trTemp,
	tdTemp,
} from './temps'

export const defaultColumnWidth = 100

// 插件初始化
// const plugins = [];
// const pluginsConfig = require('../plugin/config');
// const pluginFiles = require.context('../plugin', true, /^\.(\/|\\).+(\/|\\)index\.js$/);
// const usePlugins = getUniqueArray(pluginsConfig.usePlugins);
// pluginFiles.keys().forEach(
// 	key => {
// 		const name = key.substring(key.search(/(\/|\\)/) + 1, key.search(/(\/|\\)index\.js$/));
// 		const index = usePlugins.indexOf(name);
// 		if (index !== -1) {
// 			const plugin = pluginFiles(key).default;
// 			if (plugin && typeof plugin.prototype.shouldUse === 'function' && typeof plugin.prototype.create === 'function') {
// 				plugins[index] = { name, plugin };
// 			}
// 		}
// 	}
// );

// 渲染主函数
export default function render(options) {
	this.state = {}
	this.plugins = []
	const plugins = [...this.constructor.plugins]
	const { id, className } = options;

	// 插件实例化
	// constructor 钩子 (预处理)
	for (let i = 0, len = plugins.length; i < len; i++) {
		const { name, construct } = plugins[i]
		const instance = new construct(this, options);
		this.plugins.push({
			name,
			instance
		})
		// if (plugin.beforeInit) plugin.beforeInit(options);
	}

	// 表格结构生成
	const wrapper = temp.cloneNode();
	wrapper.className = 'iTable';
	this.table = wrapper;

	if (typeof id === 'string') wrapper.setAttribute('id', id);
	if (typeof className === 'string') wrapper.classList.add(className);

	const iTable = tableTemp.cloneNode();
	wrapper.appendChild(iTable);

	const theadGroup = theadTemp.cloneNode()
	const theadChild = theadTemp.cloneNode()
	const	tbodyGroup = temp.cloneNode()
	const	tbody = tbodyTemp.cloneNode()

	tbodyGroup.className = 'it-tbody-group'
	tbodyGroup.appendChild(tbody)

	// 渲染表头, 该方法会配置 useFooter 和 columnProps
	const { groupTr, childTr } = renderHeader.apply(this)

	const column = this.columnProps.length
	const tableMinWidth = column * defaultColumnWidth
	theadGroup.appendChild(groupTr)
	theadGroup.style.minWidth = `${tableMinWidth}px`
	iTable.appendChild(theadGroup)

	if (childTr) {
		theadGroup.classList.add('group')
		theadChild.classList.add('shadow')
		theadChild.appendChild(childTr)
		theadChild.style.minWidth = `${tableMinWidth}px`
		iTable.appendChild(theadChild)
	} else {
		theadGroup.classList.add('shadow')
	}

	iTable.appendChild(tbodyGroup)

	// 渲染表主体
	renderBodyStruct.apply(this)
	renderBodyData.apply(this)

	// 渲染表脚
	if (this.state.useFooter) {
		const tfootGroup = temp.cloneNode()
		tfootGroup.className = 'it-tfoot'
		tfootGroup.appendChild(renderFooter.apply(this))
		iTable.appendChild(tfootGroup)
	}

	// 暴露表格主体渲染方法
	this.renderBodyStruct = renderBodyStruct.bind(this)
	this.renderBodyData = renderBodyData.bind(this)

	// 加载插件
	for (let i = 0, len = this.plugins.length; i < len; i++) {
		const plugin = this.plugins[i].instance
		const disabled = !plugin.shouldUse()
		if (disabled) continue
		if (plugin.beforeCreate) plugin.beforeCreate()
		plugin.create()
		if (plugin.bindEvent) plugin.bindEvent()
		if (plugin.afterCreate) plugin.afterCreate()
	}
}

// 头部列渲染
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

// 表头渲染
function renderHeader() {
	const columns = this.columns
	let columnProps = []
	let	groupTr = trTemp.cloneNode()
	let childTr = trTemp.cloneNode()

	let hasChilds = false
	let useFooter = false
	for (let i = 0, len = columns.length; i < len; i++) {
		const column = columns[i]

		const props = renderColumn(column)
		columnProps.push(props)

		const groupTh = props.target
		groupTr.appendChild(groupTh)

		if (props.parent) {
			hasChilds = true
			const childrenIds = []
			const { children } = column
			let width = 0
			for (let j = 0, len = children.length; j < len; j++) {
				const column = children[j]
				column.parentTarget = groupTh
				const props = renderColumn(column)
				columnProps.push(props)

				const childTh = props.target
				childTr.appendChild(childTh)
				width += props.width
				childrenIds.push(props.id)
			}
			groupTh.style.cssText = `flex: ${width} 0 auto; width: ${width}px`
			groupTh.itChildrenSize = children.length
			groupTh.itChildrenIds = childrenIds
		}
	}

	if (hasChilds) columnProps = columnProps.filter(props => !props.parent)

	for (let i = 0, len = columnProps.length; i < len; i++) {
		const props = columnProps[i]
		props.index = parseInt(i)
		if (props.hasFooter) useFooter = true
	}

	this.columnProps = columnProps
	this.state.useFooter = useFooter

	return { groupTr, childTr: hasChilds? childTr: null }
}

// 表格主体渲染
function renderBodyStruct() {
	const { table, data, plugins, columnProps } = this
	const fragment = document.createDocumentFragment()

	const afterHookFns = []
	// beforeRenderBody 钩子 (表格结构变化)
	let length = data.length
	for (let i = 0, len = plugins.length; i < len; i++) {
		const plugin = plugins[i].instance
		const disabled = !plugin.shouldUse()

		if (!disabled && plugin.beforeRenderBody) {
			length = plugin.beforeRenderBody(length) || length
		}

		if (plugin.afterRenderBody) {
			afterHookFns.unshift(plugin.afterRenderBody.bind(plugin))
		}
	}
	const tbody = table.querySelector('.it-tbody')
	const trGroups = tbody.querySelectorAll('.it-tr-group')

	if (trGroups.length) {
		// 结构变化
		const currentLength = trGroups.length
		// const groupTemp = trGroups[0];
		if (length > currentLength) {
			// 增加行数
			const count = length - currentLength
			const groupTemp = tbody.querySelector('.it-tr-group:first-child')

			for (let i = 0; i < count; i++) {
				const group = groupTemp.cloneNode(true);
				group.rowIndex = currentLength + parseInt(i)
				fragment.appendChild(group)
			}

			tbody.appendChild(fragment)
		} else {
			// 减少行数
			const deleteTrGroups = tbody.querySelectorAll(`.it-tr-group:nth-child(n+${length + 1})`)

			for (let i = 0, len = deleteTrGroups.length; i < len; i++) {
				const trGroup = deleteTrGroups[i];
				tbody.removeChild(trGroup);
			}
		}
	} else {
		// 初始化渲染
		const ths = table.querySelectorAll('.it-thead.shadow .it-th')

		for (let i = 0; i < length; i++) {
			// const rowData = data[i] || {};
			const group = trGroupTemp.cloneNode()
			const tr = trTemp.cloneNode()
			tr.rowIndex = parseInt(i)

			for (let j = 0, len = columnProps.length; j < len; j++) {
				const td = tdTemp.cloneNode()
				const width = parseFloat(ths[j].style.width)
				td.style.cssText = `flex: ${width} 0 auto; width: ${width}px`
				td.rowIndex = parseInt(i)
				td.columnIndex = parseInt(j)
				tr.appendChild(td)
			}

			group.appendChild(tr)
			fragment.appendChild(group)
		}

		tbody.appendChild(fragment)
	}

	// afterRenderBody 钩子
	// for (const callback of afterHookFns) callback(length)
	for (let i = 0, len = afterHookFns.length; i < len; i++) {
		afterHookFns[i](length)
	}
}

// 渲染数据方法
function renderBodyData(target) {
	const { table, plugins, columnProps } = this

	const afterHookFns = []
	// beforeRenderData 钩子
	const originData = this.data
	let data = originData

	for (let i = 0, len = plugins.length; i < len; i++) {
		const plugin = plugins[i].instance
		const disabled = !plugin.shouldUse()

		if (!disabled && plugin.beforeRenderData) {
			data = plugin.beforeRenderData(data) || data
		}

		if (plugin.afterRenderData) {
			afterHookFns.unshift(plugin.afterRenderData.bind(plugin))
		}
	}

	this.state.computedData = data || originData

	const tbody = table.querySelector('.it-tbody')
	const trGroups = tbody.querySelectorAll('.it-tr-group')

	for (let i = 0, len = trGroups.length; i < len; i++) {
		const tr = trGroups[i].querySelector('.it-tr')
		const rowData = data[i] || {}
		const tds = tr.querySelectorAll('.it-td')

		for (let j = 0, len = columnProps.length; j < len; j++) {
			const { accessor } = columnProps[j]
			const td = tds[j]

			const result = accessor(rowData)
			const html = typeof result !== 'undefined'? result: '&nbsp;'

			if (typeof html !== 'object') {
				td.innerHTML = html
			} else {
				td.innerHTML = ''
				td.appendChild(html)
			}
		}
	}

	// afterRenderData 钩子
	// for (const callback of afterHookFns) callback(data)
	for (let i = 0, len = afterHookFns.length; i < len; i++) {
		afterHookFns[i](data)
	}
}

// 表格脚部渲染
function renderFooter(target) {
	const { data, columnProps, state: currentState } = this

	const columnData = new Map()
	for (let i = 0, len = columnProps.length; i < len; i++) {
		columnData.set(i, [])
	}

	for (let i = 0, len = data.length; i < len; i++) {
		const rowData = data[i]
		for (let j = 0, len = columnProps.length; j < len; j++) {
			const { accessor } = columnProps[j]
			columnData.get(j).push(accessor(rowData))
		}
	}
	
	const tr = trTemp.cloneNode()
	for (let i = 0, len = columnProps.length; i < len; i++) {
		const { footer, width } = columnProps[i]
		const td = tdTemp.cloneNode()
		td.style.cssText = `flex: ${width} 0 auto; width: ${width}px`

		const content = temp.cloneNode()
		content.className = 'it-foot-content'

		const result = footer(columnData.get(i), {...currentState})
		const title = typeof result !== 'undefined'? result: '&nbsp;'

		if (typeof title !== 'object') {
			content.innerHTML = title
		} else {
			content.appendChild(title)
		}

		td.appendChild(content)
		tr.appendChild(td)
	}
	return tr
}
