# Flex Table

[![version](https://img.shields.io/github/package-json/v/qmhc/FlexTable)](https://github.com/qmhc/FlexTable)
[![license](https://img.shields.io/github/license/qmhc/FlexTable)](https://github.com/qmhc/FlexTable/blob/master/LICENSE)

**Engilsh** | [中文](./README_CN.md)

FlexTable is a library with native javascript that completely based on flex, without any `table` html, it can be used to generate table quickly.

The core code of FlexTable only contains rendering table functions, all the other features are provided by plugins, you can also add or replace plugins according to your own use.

![视觉](./public/visual.png)


## Start

Use npm.

```bash
npm install --save @qmhc/flex-table
```

```js
import FlexTable from '@qmhc/flex-table'

import '@qmhc/flex-table/dist/flex-table.css'
```

Import on demand.

```js
import FlexTable from '@qmhc/flex-table/dist/flex-table.core'
import Sorter from '@qmhc/flex-table/dist/plugin/Sorter'

import '@qmhc/flex-table/dist/core/flex-table.core.css'
import '@qmhc/flex-table/dist/plugin/Sorter.css'
```

Use tags.

```html
<!-- js -->
<script src="./dist/flex-table.js"></script>

<!-- css -->
<link rel="stylesheet" href="./dist/flex-table.css">
```

Import on demand.

```html
<!-- js -->
<script src="../dist/core/flex-table.core.js"></script>
<script src="../dist/plugin/Sorter.js"></script>

<!-- css -->
<link rel="stylesheet" href="../dist/core/flex-table.core.css">
<link rel="stylesheet" href="../dist/plugin/Sorter.css">
```

Create a table.

```javascript
// 创建表格
const flexTable = new FlexTable({
  container: '#app',
  columns: [{ /*...*/ }],
  data: [{ /*...*/ }],
  plugins: {
      // ...
  }
})
```

Manually register plugins when import on demand.

```js
FlexTable.registerPlugin('sorter', Sorter)

// 使用标签引入时
FlexTable.registerPlugin('sorter', FlexTable.Sorter)
```

## Example

For a simple example see [`example/index.html`](./example/index.html).


## Config

A complete configuration.

```javascript
{
  container: '#app',
  columns,
  data,
  className: '',
  id: '',
  rowClassName: (data, index) => '', // index is the data rendering in the row index of the table
  stripe: true,
  dangerous: false, // insert string as html
  plugins: {
    selector: {}, // no property, only define an empty object
    editor: {
      trigger: 'action', // or 'click'
      // verifier: data => data, // global verifier
      columnWidth: 142,
      columnName: '操作', // editor column header
      labels: {
        edit: '编辑',
        save: '保存',
        cancel: '取消'
      }
    },
    resizer: {
      force: false // whether to set each column to true width after the table is added to document
    },
    sorter: {
      multiple: true, // turn on multi-column sorting
      multipleKey: 'shift' // multi-column sorting key, optional ctrl, alt, shift
    },
    extender: {
      // extend row renderer, receiving row data as parameter
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
      filterAll: true, // all columns defalut filter (if there are separate settings for the column, the column settings are preferred)
      openAction: false, // filter toggle switch
      filterOpen: true
    },
    layer: {
      loading: false,
      notFound: true,
      delay: 500,
      loadingText: '加载中',
      notFoundText: '无数据'
    },
    scroller: {
      height: 450,
      mouse: true,
      wheel: false,
      wheelDistance: 20
    }
  },
  theme: 'light',
  deepClone: true // whether deep clone data during init
}
```

Complete configuration of `columns`.

```js
{
  name: 'First Name', // colunm header, optional Number String Array<HTMLElemnt> NodeList HTMLElement
  accessor: data => data.firstName, // tell FlexTable how to read the data, parameter is row data, return refers to the name property
  key: 'firstName', // column key, it is important, ensure that FlexTable can read the original data
  footer: data => `Total: ${data.length}`, // parameter is columns data
  resizable: true, // column resize
  sortable: true, // column sort
  defaultSort: 1, //  1 for asc, 2 for desc
  sorter: (prev, next) => prev.toString().localeCompare(next),
  filterable: true, // column filter
  // filter method, column value - filter value - original data
  filter: (value, filter, origin) => {
    if (value.includes(filter)) {
      return true
    }
  },
  filterOptions: {
    type: 'text',
    // options: ['prepare', 'process', 'finish'] // use when type is 'select'
  }
  editable: true, // column edit
  editType: 'select',
  editOptions: ['Kegdhi', 'Tshudgh', 'Asihvsit'] // use when type is 'select'
  defaultWidth: 100 // default column width
}
```

Note: FlexTable uses a strict comparison when parsing the configuration, for example, the default enabled property needs to be `===` to `false` can disable it, vice versa.

<!-- PS: 内置的 `resizer` 插件是基于 `Proxy` 编写的，使用时请注意兼容性 -->

## Theme

FlexTable has four theme, configure `theme` property to use them.

```javascript
{
  theme: 'dark',
  // theme: 'blue',
  // theme: 'red',
  // theme: 'light', // default
  // ...
}
```

If this is not you want, you can refer to the `scss` file under `/src/style` to configure your own theme.

## Plugin

You can implement your own plugins according to the  [`src/plugin/temp.js`](././src/plugin/temp.js), such as an async loading data plugin.

Don't forget to register the plugin after complete.

```js
import FlexTable from '@qmhc/flex-table'
import myPlugin from 'my-plugin'

FlexTable.registerPlugin(name, myPlugin)
```

You can als replace one plugin with `replacePlugin` method.

## License

[MIT](./LICENSE)
