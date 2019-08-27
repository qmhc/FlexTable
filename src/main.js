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
      children: [{
        name: 'First Name',
        accessor: 'firstName',
        key: 'firstName',
        filter: true,
        defaultSort: 1,
        sorter: (prev, next) => {
        // console.log(prev, next)
          return prev.toString().localeCompare(next)
        }
      },
      {
        name: 'Last Name',
        accessor: data => {
          return data.lastName
        },
        key: 'lastName',
        filterable: false,
        filterOptions: {
          type: 'date',
          dateType: 'datetime-local'
        },
        editable: () => false
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
          editOptions: range(45, 16)
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
            for (const value of data) {
              sum += value
            }

            span.textContent = `Max: ${Math.round(sum / data.length)}`
            return span
          },
          filter: (value, filter) => {
            switch (filter) {
              case 'process':
                return value > 0 && value < 100
              case 'finish':
                return value === 100
              default:
                return value === 0
            }
          },
          filterOptions: {
            type: 'select',
            options: ['prepare', 'process', 'finish']
          }
        }
      ]
    }
  ]
}

const columns = getColumns()
const data = makeData()

console.time('render')

const table = new FlexTable({
  container: '#app',
  columns,
  data,
  className: 'my-flex-table',
  id: 'myTable',
  rowClassName: data => 'my-table-row',
  stripe: false,
  plugins: {
    selector: {}, // 暂无独立配置项, 只需指定一个空对象
    editor: {
      trigger: 'action', // or 'click'
      verifier: data => data, // 顶层验证方法
      columnWidth: 142,
      columnName: '操作',
      labels: {
        edit: '编辑',
        save: '保存',
        cancel: '取消'
      }
    },
    resizer: {}, // 暂无独立配置项, 只需指定一个空对象
    sorter: {
      multiple: true, // 开启多列排序功能
      multipleKey: 'shift' // 启动多列排序的按键, 可选 ctrl, alt, shift
    },
    pager: {
      useOptions: true,
      pageOptions: [10, 15, 20, 25, 30],
      currentPage: 1,
      pageSize: 15,
      labels: {
        prev: '上一页',
        next: '下一页',
        row: '行'
      }
    },
    filter: {
      filterAll: true, // 所有类均过滤 (如有列单独设置, 则优先使用列设置, 否则使用默认过滤设置)
      openAction: true, // filter 是否具有开关按钮
      filterOpen: false // filter 具有开关按钮, 设置是否默认打开 openAction 为 false 时忽略
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
      wheel: false,
      wheelDistance: 20
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

table.on('columnResize', ev => {
  console.log(ev)
})

table.on('selectChange', ev => {
  console.log(ev)
})
