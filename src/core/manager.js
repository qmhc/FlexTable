import render from './render';
import { table, state } from './status';
import { deepClone } from '@/utils';

class Manager {
	constructor() {}
	create({ index, data, columns, container, theme, ...props }) {
		// 有效索引
		if (!index) {
			console.error(`Parameter 'index' must be a String or a Number.`);
			return false;
		}

		// 唯一索引
		if (table[index]) {
			console.warn(`iTable '${index}' has been created.`);
			return false;
		}

		// 获取容器
		switch (typeof container) {
			case 'string': 
				container = document.querySelector(container);
				if (!container) {
					console.error(`Node for selector '${container}' is not defined.`);
					return false;
				}
			case 'object': break;
			default: 
				console.error(`Parameter 'container' must be a String or a HTMLObject.`);
				return false;
		}

		// 数据克隆
		if (props.deepClone !== false) data = deepClone(data);

		table[index] = { columns, data };
		render(index, {...props});
		const fragment = document.createDocumentFragment();
		const iTable = table[index].target;

		// 设置主题
		switch (theme) {
			case 'blue': iTable.classList.add('theme-blue'); break;
			case 'red': iTable.classList.add('theme-red'); break;
			case 'dark': iTable.classList.add('theme-dark'); break;
			default: iTable.classList.add('theme-light');
		}

		fragment.appendChild(iTable);
		container.appendChild(fragment);
		return true;
	}
	getTableList() {
		return Object.keys(table);
	}
	destroy(index) {
		try {
			if (table[index]) {
				const target = table[index].target;
				if (target && target.parentNode) {
					target.parentNode.removeChild(target);
				}
				table[index] = undefined;
				state[index] = undefined;
				return true;
			} else {
				console.warn(`iTable '${index}' is not defined.`);
			}
		} catch(e) {
			console.warn(`destroy Has an error in destroying iTable '${index}'.`);
		}
		return false;
	}
	// usePlugins(...customPlugins) {
	// 	for (let plugin of customPlugins) {

	// 	}
	// }
}

export default Manager;
