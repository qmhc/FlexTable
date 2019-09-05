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
          filter: true,
          sort: {
            // type: 1,
            method: (prev, next) => {
              return prev.toString().localeCompare(next)
            }
          }
        },
        {
          name: 'Last Name',
          accessor: data => {
            return data.lastName
          },
          key: 'lastName',
          filter: {
            able: true,
            // type: 'date',
            // dateType: 'datetime-local'
            type: 'check',
            options: [
              { title: 'Starts with Y', value: 'Y' },
              { title: 'Starts with N', value: 'N' },
              { title: 'Starts with H', value: 'H' }
            ],
            method: (value, filter) => {
              for (let i = 0, len = filter.length; i < len; i++) {
                if (value.toString().startsWith(filter[i])) {
                  return true
                }
              }
              return false
            }
          },
          edit: {
            able: () => false
          }
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
          resize: false,
          edit: {
            type: 'select',
            options: range(45, 16)
          }
        },
        {
          name: 'Visits',
          accessor: 'visits',
          key: 'visits',
          footer: data => {
            const span = document.createElement('span')
            span.style.fontWeight = 700
            span.textContent = `Total: ${data.reduce((prev, curr) => (prev + curr), 0)}`
            return span
          },
          filter: {
            type: 'number'
          },
          edit: {
            type: 'number'
          }
        },
        {
          name: 'Progress',
          accessor: 'progress',
          key: 'progress',
          footer: data => {
            const span = document.createElement('span')
            span.style.fontWeight = 700

            let sum = 0
            for (const value of data) {
              sum += value
            }

            span.textContent = `Avg: ${Math.round(sum / data.length)}`
            return span
          },
          filter: {
            type: 'select',
            options: ['prepare', 'process', 'finish'],
            method: (value, filter) => {
              switch (filter) {
                case 'process':
                  return value > 0 && value < 100
                case 'finish':
                  return value === 100
                default:
                  return value === 0
              }
            }
          }
        }
      ]
    }
  ]
}
