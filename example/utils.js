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
}

const range = count => {
	const list = []
	for (let i = 0; i < count; i++) {
		list.push(i)
	}
	return list
}

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
					editType: 'select',
					editOptions: range(45)
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
					editType: 'number'
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
