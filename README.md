# iTable

`flex-table` 是一款原生的表格工具，其完全基于flex，没有任何的table相关的html，可用于快速生成数据表格。

![视觉](./public/visual.png)


## 开始

```bash
npm install --save flex-table
```

引入 `build` 文件夹下的 `flex-table.js` 和 `flex-table.css`

```html
<!-- js -->
<script src="./build/flex-table.js"></script>

<!-- css -->
<link rel="stylesheet" href="./build/flex-table.css">
```

创建一个表格

```javascript
// 实例化后的 FlexTable 其实是一个管理器
// 可以使用其多次创建表格
// 每个表格在管理器内有唯一的索引
const flexTable = new FlexTable();

// 创建表格
flexTable.create({
    index: 'it1',
    container: '#app',
    columns: [{ /*...*/ }],
    data: [{ /*...*/ }],
    // ...
});
```

## 例子

简单示例见 `tests` 文件夹下的 `index.html`


## 配置

一个简单的配置

```javascript
{
    // 表格索引 必须、唯一
    index: 'it1',
    // 表格容器 可以是css选择器或者Node对象
    container: '#app',
    // 各列相关参数
    columns: [{
        name: 'Name',
        // accessor: 'name',
        accessor: data => data.name,
        children: [],
    }],
    data: [{
        name: 'My Name',
        // ...
    }],
    useSelector: true,
    filterAll: true,
    useLayer: true,
    // ...
}
```

更具体的配置可以参考例子。

PS: 内置的 `resizer` 插件是基于 `Proxy` 编写的，使用时请注意兼容性

## 主题

`iTable` 内置有四种主题颜色，配置中添加 `theme` 属性可以设置主题

```javascript
{
    theme: 'dark',
    // theme: 'blue',
    // theme: 'red',
    // theme: 'light',     // default
    // ...
}
```

如果想自定义配置主题，可以参考 `/src/style` 下的 `scss` 文件配置主题