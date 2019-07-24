import Mock from 'mockjs'
import FlexTable from './core'

import './style/blue.scss'
import './style/red.scss'
import './style/dark.scss'

const makeData = (size = 386) => {
	const data = Mock.mock({
		[`person|${size}`]: [{
			'firstName': /[A-Z][a-z]{3,7}/,
			'lastName': /[A-Z][a-z]{3,7}/,
			'age|16-45': 1,
			'visits|1-100': 1,
			'progress|0-100': 1
		}]
	})
	return data.person
};

const getColumns = () => {
	return [
		{
			name: 'Name',
			children: [
				{
					name: 'First Name',
					accessor: 'firstName',
					key: 'firstName',
					filter: true
				},
				{
					name: 'Last Name',
					accessor: data => data.lastName,
					key: 'lastName',
					filterable: false,
					// filterOptions: {
					// 	type: 'date',
					// 	dateType: 'datetime-local'
					// }
				}
			]
		},
		{
			name: 'Info',
			children: [
				{
					name: 'Age',
					accessor: 'age',
					key: 'age',
					footer: data => {
						const span = document.createElement('span')
						span.style.fontWeight = 700
						span.textContent = `Max: ${Math.max(...data)}`
						return span
					},
					resizable: false,
					editType: 'number'
				},
				{
					name: 'Visits',
					accessor: 'visits',
					key: 'visits',
					footer: data => {
						const span = document.createElement('span')
						span.style.fontWeight = 700
						span.textContent = `Max: ${Math.min(...data)}`
						return span
					},
					filterable: true,
					filterOptions: {
						type: 'number'
					},
					editType: 'select',
					editOptions: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]
				},
				{
					name: 'Progress',
					accessor: 'progress',
					key: 'progress',
					footer: data => {
						const span = document.createElement('span')
						span.style.fontWeight = 700
						
						let sum = 0
						for (let value of data) {
							sum += value
						}

						span.textContent = `Max: ${Math.round(sum / data.length)}`
						return span
					},
					filter: (value, filter) => {
						switch (filter) {
							case 'process': return value > 0 && value < 100
							case 'finish': return value === 100
							default: return value === 0
						}
					},
					filterOptions: {
						type: 'select',
						options: ['prepare', 'process', 'finish']
					}
				}
			]
		},
		// {
		// 	name: 'First Name',
		// 	accessor: 'firstName'
		// },
		// {
		// 	name: 'Last Name',
		// 	accessor: data => data.lastName,
		// },
		// {
		// 	name: 'Age',
		// 	accessor: 'age',
		// },
		// {
		// 	name: 'Visits',
		// 	accessor: 'visits',
		// },
	]
}

// const flexTable = new Manager();

console.time('render')

const table = new FlexTable({
	// index: 'it1',
	container: '#app',
	columns: getColumns(),
	data: makeData(),
	useSelector: true,
	editable: true,
	// editTrigger: 'action',
	// sortable: false,
	// resizable: false,
	// usePageOption: false,
	// pageable: false,
	filterAll: true, // 所有类均过滤 (如有列单独设置, 则优先使用列设置, 否则使用默认过滤设置)
	filterOpen: true, // filter 具有开关按钮, 设置是否默认打开
	filterOpenAction: false, // filter 是否具有开关按钮
	// useLayer: true, // 使用遮罩层
	bodyHeight: 450,
	// theme: 'blue',
	pageable: true,
	usePageOption: true,
	pageOption: [10, 20, 50, 100],
	// pageSize: 10, // usePageOption === false 时有效
	currentPage: 1,
	currentPageOption: 1 // 当前选中分页选项的索引
});

console.timeEnd('render')

window.table = table
