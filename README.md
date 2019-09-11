# Flex Table

[![version](https://img.shields.io/github/package-json/v/qmhc/FlexTable)](https://github.com/qmhc/FlexTable)
[![license](https://img.shields.io/github/license/qmhc/FlexTable)](https://github.com/qmhc/FlexTable/blob/master/LICENSE)

**Engilsh** | [中文](./README_CN.md)

`FlexTable` is a library with native javascript that completely based on flex, without any `table` html, it can be used to generate table quickly.

The core code of `FlexTable` only contains rendering table functions, all the other features are provided by plugins, you can also add or replace plugins according to your own use.

![visual](./public/visual.png)


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

import '@qmhc/flex-table/dist/flex-table.core.css'
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
<script src="../dist/flex-table.core.js"></script>
<script src="../dist/plugin/Sorter.js"></script>

<!-- css -->
<link rel="stylesheet" href="../dist/flex-table.core.css">
<link rel="stylesheet" href="../dist/plugin/Sorter.css">
```

Create a table.

```javascript
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

// import on demand
FlexTable.registerPlugin('sorter', FlexTable.Sorter)
```

## Example

For a simple example see [`example/index.html`](./example/index.html).

Online example [`click me`](https://qmhc.github.io/FlexTable/).

## Config

A complete configuration.

```javascript
{
  container: '#app',

  columns,

  data,

  // whether deep clone data during init
  // when it is not actively set, FlexTable will automatically set it according to the data size
  // when data size less then 500, it will be set to true
  deepClone: true,

  // auto refresh while data change
  // it is implemented using Proxy, any set operation will cause the table refresh when opened
  // when using in such as Vue, both deepClone and observeData can be set to false
  // and then use Vue's watch feature to refresh the table manually
  observeData: true,

  className: 'my-table',

  id: 'myTable',

  // index is the data rendering in the row index of the table
  rowClassName: (data, index) => '',

  stripe: true,

  dangerous: false, // insert string as html

  plugins: {

    selector: {}, // no property, only define an empty object

    editor: {
      trigger: 'action', // or 'click'

      // verifier: data => data, // global verifier

      columnWidth: 142,

      columnName: 'Action', // editor column header

      labels: {
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel'
      }
    },

    resizer: {
      // whether to set each column to true width after the table is added to document
      force: false
    },

    order: {
      renderer: index => `No.${index}`,

      type: 'absolute', // or 'relative'

      columnWidth: 72,

      columnName: 'Order'
    }

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
        prev: 'Prev',
        next: 'Next',
        row: 'row'
      }
    },

    filter: {
      // all columns defalut filter
      // if there are separate settings for the column, the column settings are preferred
      filterAll: false,

      highlight: true, // highlight filter results
    },

    layer: {
      loading: false,

      notFound: true,

      delay: 500,

      loadingText: 'Loading',

      notFoundText: 'Not Found'
    },

    scroller: {
      height: 450,

      mouse: true,

      wheel: false,

      wheelDistance: 20
    }

  },

  theme: 'light'
}
```

Complete configuration of `columns`.

```js
{
  // colunm header, optional Number String Array<HTMLElemnt> NodeList HTMLElement
  name: 'First Name',

  // tell FlexTable how to read the data
  // parameter are row data and column props, return refers to the name property
  accessor: (data, props) => data.firstName,

  // column key, it is important, ensure that FlexTable can read the original data
  key: 'firstName',

  footer: data => `Count: ${data.length}`, // parameter is columns data

  resize: true, // column resize

  // column sort config
  // sort: true,
  // sort: 1,
  // sort: (prev, next) => prev.toString().localeCompare(next),
  sort: {
    able: true,
    type: 0, // 1 -> asc, 2 -> desc
    method: (prev, next) => prev.toString().localeCompare(next)
  },

  // column filter config
  // filter: true,
  // filter: 'Rocket', // default text filter value
  // filter: [10, 50], // default number filter value

  // default text filter method
  // filter: (value, filter, origin, data) => true,

  filter: {
    able: true,
    type: 'text',
    // options: ['prepare', { title: 'process', value: 'process' }, 'finish'] // use when type is 'select'
    value: undefined, // defualt filter value,

    // filter method, column value - filter value - original data - row data
    method: (value, filter, origin, data) => {
      if (value.includes(filter)) {
        return true
      }
    },
  },

  // column edit config
  // edit: true,
  // edit: data => true,
  // edit: 'text',
  edit: {
    // able: true,
    able: data => true, // row data
    type: 'select',
    options: ['Kegdhi', 'Tshudgh', 'Asihvsit'], // use when type is 'select'
    verifier: value => true
  }

  defaultWidth: 100 // default column width
}
```

Note: `FlexTable` uses a strict comparison when parsing the configuration, for example, the default enabled property needs to be `===` to `false` can disable it, vice versa.

<!-- PS: 内置的 `resizer` 插件是基于 `Proxy` 编写的，使用时请注意兼容性 -->

## Theme

`FlexTable` has four theme, configure `theme` property to use them.

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

You can also replace one plugin with `replacePlugin` method.

## License

[MIT](./LICENSE)
