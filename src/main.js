import Manager from './core/manager';
import render from './core/render';
// import { makeData, getColumns } from './utils';

import './style/itable.scss';

export const iTable = Manager;

const itable = new iTable();

// console.time('render');

// itable.create({
// 	index: 'it1',
// 	container: '#app',
// 	columns: getColumns(),
// 	data: makeData(),
// 	// useSelector: true,
// 	sortable: false,
// 	resizable: false,
// 	// usePageOption: false,
// 	// pageable: false,
// 	// filterAll: true,
// 	// filterOpen: true,
// 	// useLayer: true,
// 	// bodyHeight: 450,
// });

// console.timeEnd('render');