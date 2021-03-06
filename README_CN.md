# Flex Table

[![version](https://img.shields.io/github/package-json/v/qmhc/FlexTable)](https://github.com/qmhc/FlexTable)
[![license](https://img.shields.io/github/license/qmhc/FlexTable)](https://github.com/qmhc/FlexTable/blob/master/LICENSE)

[Engilsh](https://github.com/qmhc/FlexTable) | **中文**

`FlexTable` 是一款原生的表格工具, 其完全基于flex, 没有任何的 `table` 相关的html, 可用于快速生成数据表格

`FlexTable` 的核心代码只包含表格的基础渲染功能, 其余的所有功能均由 `plugin` 提供, 用户也可以根据自己的使用替换或添加插件

![视觉](./public/visual.png)


## 开始 (Start)

使用 npm

```bash
npm install --save @qmhc/flex-table
```

```js
import FlexTable from '@qmhc/flex-table'

import '@qmhc/flex-table/dist/flex-table.css'
```

按需引入

```js
import FlexTable from '@qmhc/flex-table/dist/flex-table.core'
import Sorter from '@qmhc/flex-table/dist/plugin/Sorter'

import '@qmhc/flex-table/dist/flex-table.core.css'
import '@qmhc/flex-table/dist/plugin/Sorter.css'
```

使用标签引入

```html
<!-- js -->
<script src="./dist/flex-table.js"></script>

<!-- css -->
<link rel="stylesheet" href="./dist/flex-table.css">
```

按需引入

```html
<!-- js -->
<script src="../dist/flex-table.core.js"></script>
<script src="../dist/plugin/Sorter.js"></script>

<!-- css -->
<link rel="stylesheet" href="../dist/flex-table.core.css">
<link rel="stylesheet" href="../dist/plugin/Sorter.css">
```

创建一个表格

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

按需引入时, 需手动注册插件

```js
FlexTable.registerPlugin('sorter', Sorter)

// 使用标签引入时
FlexTable.registerPlugin('sorter', FlexTable.Sorter)
```

## 例子 (Example)

简单示例见 `example` 文件夹下的 [`index.html`](./example/index.html)

在线示例[`点击这里`](https://qmhc.github.io/FlexTable/)

## 配置 (Config)

一份完整的配置

```javascript
{
  container: '#app',
  columns,
  data,
  className: '',
  id: '',

  // 初始化时是否对 data 进行深度克隆
  // 在不主动设置时, FlexTable 会自动根据 data 的大小自动设置
  // 当 data 不足 500 条时默认为 true
  deepClone: true,

  // 将数据设置为响应式, 当数据改变时自动刷新表格
  // FlexTable 的响应是使用 Proxy 实现的, 在打开时任意的 set 操作都会使表格刷新
  // 在使用响应式框架时, 可以将 deepClone 和 observeData 都设置为 false
  // 然后使用框架的 watcher 功能手动地刷新表格
  observeData: true, 

  rowClassName: (data, index) => '', // index 为数据渲染在表格的行索引

  stripe: true, // 为行添加斑马纹样式

  dangerous: false, // 开启插入字符串 html

  plugins: {
    selector: {}, // 暂无独立配置项, 只需指定一个空对象

    editor: {
      trigger: 'action', // or 'click'
      // verifier: data => data, // 顶层验证方法
      columnWidth: 142,
      columnName: '操作', // editor 列头
      labels: {
        edit: '编辑',
        save: '保存',
        cancel: '取消'
      }
    },
    
    resizer: {
      force: false // 设置是否在表格加入 document 后将各列设置为真实宽度
    },

    order: {
      renderer: index => index, // 根据索引结果返回渲染内容
      type: 'absolute', // 定义为 'relative' 时会根据渲染在表格的实际位置编号
      columnWidth: 60,
      columnName: '序号'
    }

    sorter: {
      multiple: true, // 开启多列排序功能
      multipleKey: 'shift' // 启动多列排序的按键, 可选 ctrl, alt, shift
    },

    extender: {
      // 拓展行的渲染函数, 参数为该行数据
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
      accordion: false, // 设置开启手风琴模式
      transition: true // 设置禁用过渡效果
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
      filterAll: false, // 所有列均过滤 (如有列单独设置, 则优先使用列设置, 否则使用默认过滤设置)
      highlight: true // 设置对符合过滤条件的结果进行高亮
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

  theme: 'light'
}
```

`columns` 的完整配置

```js
{
  // 表头列名, 可以是 Number String Array<HTMLElemnt> NodeList HTMLElement
  name: 'First Name',

  // 在渲染数据时告诉 FlexTable 该怎么读取数据, 参数为行数据和列属性, 返回值参考 name 属性
  accessor: (data, props) => data.firstName,

  // 该列的属性名, 这很重要, 保证 FlexTable 能读取到数据的原始值
  key: 'firstName',

  // 脚部渲染方法, 参数为列数据, 返回值参考 name 属性
  footer: data => `Count: ${data.length}`, 

  resize: true, // 是否可以调整列宽

  // 排序的配置
  // sort: true,
  // sort: 1,
  // sort: (prev, next) => prev.toString().localeCompare(next),
  sort: {
    able: true,
    type: 0, // 1 -> 升序, 2 -> 降序
    method: (prev, next) => prev.toString().localeCompare(next)
  },

  // 过滤的配置
  // filter: true,
  // filter: 'Rocket', // 默认字符过滤值, 指定为数字会转换为字符串
  // filter: [10, 50], // 默认数字类型的范围过滤值

  // 过滤方法, 此时类型默认为 'text'
  // filter: (value, filter, origin, data) => true,

  filter: {
    able: true,
    type: 'text',
    // options: ['prepare', { title: 'process', value: 'process' }, 'finish'] // 'select' 类型时使用
    value: undefined, // 默认过滤值,

    // 参数分别为: 读取的值, 过滤控件的值, 原始值, 行数据
    method: (value, filter, origin, data) => {
      if (value.includes(filter)) {
        return true
      }
    },
  },

  // 编辑的配置
  // edit: true,
  // edit: data => true, // 接收行数据
  // edit: 'text',
  edit: {
    // able: true,
    able: data => true,
    type: 'select',
    options: ['Kegdhi', 'Tshudgh', 'Asihvsit'], // 'select' 时使用
    verifier: value => true
  }

  defaultWidth: 100 // 默认列宽
}
```

注意: `FlexTable` 在解析配置时使用的是严格比较, 即默认开启的属性需要全等于 `false` 才会禁用生效, 反之亦然

<!-- PS: 内置的 `resizer` 插件是基于 `Proxy` 编写的，使用时请注意兼容性 -->

## 主题 (Theme)

`FlexTable` 内置有四种主题颜色，配置中添加 `theme` 属性可以设置主题

```javascript
{
  theme: 'dark',
  // theme: 'blue',
  // theme: 'red',
  // theme: 'light', // default
  // ...
}
```

如果这不是你想要的主题, 可以参考 `/src/style` 下的 `scss` 文件配置主题

## 插件 (Plugin)

可以根据使用需要 (如实时加载数据) 实现自己的插件, 插件的模版可以参考 [`./src/plugin/temp.js`](././src/plugin/temp.js)

随后, 在 FlexTable 上注册插件

```js
import FlexTable from '@qmhc/flex-table'
import myPlugin from 'my-plugin'

FlexTable.registerPlugin(name, myPlugin)
```

也可以使用 `replacePlugin` 方法替换具体插件

## 授权 (License)

[MIT](./LICENSE)
