import Mock from 'mockjs';

export const makeData = (size = 386) => {
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

export const getColumns = () => {
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

export const prependChild = (target, child) => {
	target.insertBefore(child, target.firstChild);
}

export const getStyle = obj => {
	if (window.getComputedStyle) {
		return window.getComputedStyle(obj, null);
	} else {
		return obj.currentStyle;
	}
}

export const toggleDisabled = (button, disabled) => {
	if (disabled) {
		button.setAttribute('disabled', '');
	} else {
		button.removeAttribute('disabled');
	}
};

export const createSelect = (options, defaultIndex = -1) => {
	for (let i in options) {
		const option = options[i];
		if (typeof option !== 'object') {
			options[i] = {
				title: option,
				value: option,
			};
		}
	}

	const div = document.createElement('div');
	div.className = 'it-select';

	const span = document.createElement('span');
	span.innerHTML = '&nbsp;';
	div.appendChild(span);

	let _value = '';
	Reflect.defineProperty(div, 'itValue', {
		get() {
			return _value;
		},
		set(newValue) {
			if (_value !== newValue) {
				span.innerHTML = options.find(opt => opt.value === newValue).title || '&nbsp';
				_value = newValue;
			}			
		},
		enumerable : true,
		configurable : true,
	});

	const ul = document.createElement('ul');
	ul.className = 'it-option'

	const liTemp = document.createElement('li');
	liTemp.className = 'it-item';

	for (let i in options) {
		const option = options[i]
		const { title, value } = option;
		const li = liTemp.cloneNode();
		li.innerHTML = title || '&nbsp;';
		li.itValue = value;
		li.index = i;
		if (i == defaultIndex) {
			div.itValue = value;
			li.classList.add('current');
		}
		ul.appendChild(li);
	}

	div.appendChild(ul);

	ul.addEventListener('click', function(ev) {
		const evt = ev || event;
		const target = evt.target || evt.srcElement;
		if (target.classList.contains('it-item')) {
			const newValue = target.itValue;
			if (div.itValue === newValue) return; 

			const current = ul.querySelector('li.it-item.current');
			if (current) current.classList.remove('current');

			const newTitle = target.textContent;
			const optionIndex = target.index;

			// 定义事件
			const event = new Event('change');
			event.oldValue = div.itValue;
			event.newValue = newValue;
			event.optionIndex = optionIndex;
			div.dispatchEvent(event);

			div.itValue = newValue;
			// span.textContent = newTitle;
			target.classList.add('current');
		}
	});

	let showOption = false;
	div.addEventListener('click', function() {
		if (showOption) {
			ul.style.cssText = 'display: none';
		} else {
			// const rect = div.getBoundingClientRect();
			const rect = getStyle(div);
			const { left, top, height, width } = rect;
			ul.style.display = 'block';
			ul.style.top = `${parseFloat(top) + parseFloat(height) + 2}px`;
		}
		showOption = !showOption;
	});

	return div;
};

export const sortByProps = (obj, props) => {
	if (!obj.sort || !props.length) return obj;
	const sortObj = [...obj];
	const defaultSortMethod = (a, b) => a > b? 1: a < b? -1: 0;
	props = props.map(
		value => typeof value === 'object'? value: { key: value, sorter: defaultSortMethod, type: 'asc' }
	).map(
		value => { 
			if (typeof value.accessor !== 'function') {
				value.accessor = data => data[value.key];
			}
			if (typeof value.sorter !== 'function') {
				value.sorter = defaultSortMethod;
			}
			return value;
		}
	);
	sortObj.sort(
		(prev, next) => {
			const results = [];
			for (let i = 0, len = props.length; i < len; i++) {
				const prop = props[i];
				const { sorter, type, accessor } = prop;
				let asc = type === 'asc';
				const result = sorter(accessor(prev), accessor(next));
				results.push(asc? result: -result);
				if (result) break;
			}
			for (let result of results) {
				if (result) return result;
			}
			return 0;
		}
	);
	return sortObj;
}

export const checkPathByClass = (node, className) => {
	if (!node.parentNode) return null;
	if (node.classList.contains(className)) return node;
	while (node.parentNode) {
		node = node.parentNode;
		if (node === document.body) return null;
		if (node.classList.contains(className)) return node;
	}
	return null;
};

// 简单 (非深度) 去重
export const getUniqueArray = array => {
	const uniqueArray = [];
	// for (let i = 0, len = array.length; i < len; i++) {
	// 	for (let j = i + 1; j < len; j ++) {
	// 		if (array[i] === array[j]) {
	// 			i++;
	// 			j = i;
	// 		}
	// 	}
	// 	uniqueArray.push(array[i]);
	// }
	for (let i = 0, len = array.length; i < len; i++) {
		if (!uniqueArray.includes(array[i])) {
			uniqueArray.push(array[i]);
		}
	}
	return uniqueArray;
}

// 生成uuid (v4)
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');		// ABCDEFGHIJKLMNOPQRSTUVWXYZ
export const getUuid = () => {
	const uuid = new Array(36);
	let random1 = 0, random2;
	for (let i = 0; i < 36; i++) {
		switch (i) {
			case 8:
			case 13:
			case 18:
			case 23: uuid[i] = '-'; break;
			case 14: uuid[i] = '4'; break;
			default: {
				if (random1 <= 0x02) random1 = 0x2000000 + (Math.random() * 0x1000000)|0;
				random2 = random1 & 0xf;
				random1 = random1 >> 4;
				uuid[i] = CHARS[(i === 19)? (random2 & 0x3)|0x8: random2];
			};
		}
	}
	return uuid.join('');
};

export const deepClone = obj => {
	const objStr = JSON.stringify(obj);
	return JSON.parse(objStr);
};

export default {
	makeData,
	getColumns,
	getStyle,
	toggleDisabled,
	sortByProps,
	getUniqueArray,
	getUuid,
	deepClone,
	prependChild,
	checkPathByClass,
};