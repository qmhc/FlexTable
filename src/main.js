import Mock from 'mockjs';
import Manager from './core/manager';

import './style/itable.scss';
import './style/blue.scss';
import './style/red.scss';
import './style/dark.scss';

const makeData = (size = 386) => {
	const data = Mock.mock({
		[`person|${size}`]: [{
			'firstName': /[A-Z][a-z]{3,7}/,
			'lastName': /[A-Z][a-z]{3,7}/,
			'age|16-45': 1,
			'visits|1-100': 1,
			'progress|0-100': 1,
		}]
	});
	return data.person;
};

const getColumns = () => {
	return [
		{
			name: 'Name',
			children: [
				{
					name: 'First Name',
					accessor: 'firstName',
					filter: true,
				},
				{
					name: 'Last Name',
					accessor: data => data.lastName,
				},
			],
		},
		{
			name: 'Info',
			children: [
				{
					name: 'Age',
					accessor: 'age',
					footer: data => `<span style="font-weight:700">Max:</span> ${Math.max(...data)}`,
					resizer: false,
				},
				{
					name: 'Visits',
					accessor: 'visits',
					footer: data => `<span style="font-weight:700">Min:</span> ${Math.min(...data)}`,
					filter: true,
					filterOptions: {
						type: 'number',
					}
				},
				{
					name: 'Progress',
					accessor: 'progress',
					footer: data => {
						let sum = 0;
						for (let value of data) {
							sum += value;
						}
						return `<span style="font-weight:700">Avg:</span> ${Math.round(sum / data.length)}`;
					},
					filter: (value, filter) => {
						switch (filter) {
							case 'process': return value > 0 && value < 100;
							case 'finish': return value === 100;
							default: return value === 0;
						}
					},
					filterOptions: {
						type: 'select',
						options: ['prepare', 'process', 'finish'],
					},
				},
			],
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
	];
}

const itable = new Manager();

console.time('render');

itable.create({
	index: 'it1',
	container: '#app',
	columns: getColumns(),
	data: makeData(),
	useSelector: true,
	// sortable: false,
	// resizable: false,
	// usePageOption: false,
	// pageable: false,
	filterAll: true,
	filterOpen: true,
	// useLayer: true,
	// bodyHeight: 450,
	theme: 'red',
});

console.timeEnd('render');