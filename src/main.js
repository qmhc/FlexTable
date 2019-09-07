import Mock from 'mockjs'
import FlexTable from './core'

import './style/blue.scss'
import './style/red.scss'
import './style/dark.scss'

const makeData = (size = 386) => {
  const data = Mock.mock({
    [`person|${size}`]: [{
      firstName: /[A-Z][a-z]{3,7}/,
      lastName: /[A-Z][a-z]{3,7}/,
      'age|16-45': 1,
      'visits|1-100': 1,
      'progress|0-100': 1
    }]
  })
  return data.person
}

window.makeData = makeData

const range = (count, start = 1) => {
  const list = []
  for (let i = start; i <= count; i++) {
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

const columns = getColumns()
const data = makeData(30)

// const wrapper = document.createElement('div')

console.time('render')

const table = new FlexTable({
  container: '#app',
  columns,
  data,
  observeData: true,
  // className: 'my-flex-table',
  className: {
    'my-flex-table': true,
    'data-table': true
  },
  id: 'myTable',
  rowClassName: data => 'my-table-row',
  stripe: false,
  dangerous: false, // 开启插入字符串 html
  plugins: {
    selector: {}, // 暂无独立配置项, 只需指定一个空对象
    editor: {
      trigger: 'action', // or 'click'
      verifier: data => data, // 顶层验证方法
      columnWidth: 142,
      columnName: 'Action',
      labels: {
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel'
      }
    },
    extender: {
      renderer: data => {
        const ul = document.createElement('ul')
        ul.style.cssText = `
          padding: 10px 50px;
          list-style: none
        `

        const nameLi = document.createElement('li')
        nameLi.textContent = `Full Name: ${data.firstName} ${data.lastName}`

        const ageLi = nameLi.cloneNode()
        ageLi.textContent = `Age: ${data.age}`

        ul.appendChild(nameLi)
        ul.appendChild(ageLi)

        return ul
      },
      accordion: false,
      transition: true
    },
    resizer: {
      force: false
    },
    sorter: {
      multiple: true, // 开启多列排序功能
      multipleKey: 'shift' // 启动多列排序的按键, 可选 ctrl, alt, shift
    },
    // pager: {
    //   useOptions: true,
    //   pageOptions: [10, 15, 20, 25, 30],
    //   currentPage: 1,
    //   pageSize: 15,
    //   labels: {
    //     prev: '上一页',
    //     next: '下一页',
    //     row: '行'
    //   }
    // },
    filter: {
      filterAll: true, // 所有类均过滤 (如有列单独设置, 则优先使用列设置, 否则使用默认过滤设置)
      highlight: true // 设置对符合过滤条件的结果进行高亮
    },
    // layer: {
    //   loading: true,
    //   notFound: false,
    //   delay: 500,
    //   loadingText: '加载中',
    //   notFoundText: '无数据'
    // },
    scroller: {
      height: 450,
      mouse: true,
      wheel: true,
      wheelDistance: 20,
      // pullup: (instance, finish) => {
      //   const { data } = instance
      //   const newData = [...data, ...makeData(10)]

      //   setTimeout(() => {
      //     instance.data = newData
      //     // instance.refresh({ data: true, struct: true })

      //     finish(true)
      //   }, 1000)
      // },
      pullupThreshold: 10,
      pullupTip: '加载中...'
    }
  }
  // theme: 'blue'
})

console.timeEnd('render')

window.table = table

table.on('editSave', ev => {
  console.log(ev)
})

table.on('editCancel', ev => {
  console.log(ev)
})

// table.on('columnResize', ev => {
//   console.log(ev)
// })

table.on('selectChange', ev => {
  console.log(ev)
})
