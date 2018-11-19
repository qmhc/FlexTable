# iTable

`i-table` 是一款原生的表格工具，用于快速生成数据表格。

## 开始

1. 克隆项目至本地
```bash
# git
$ git clone http://192.168.2.4:3000/qmhc/i-table.git

#npm
$ npm install
$ npm run bild
```

2. 引入 `build` 文件夹下的 `itable.js` 和 `itable.css`
```html
<!-- js -->
<script src="./build/itable.js"></script>

<!-- css -->
<link rel="stylesheet" href="./build/itable.css">
```

## 例子

简单示例见 `tests` 文件夹下的 `index.html`

## 配置

一个简单的配置
```javaScript
{
    // 表格索引 必须、唯一
    index: 'it1',
    // 表格容器 可以是css选择器或者Node对象
    container: '#app',
    // 各列相关参数
    columns： [{
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
}
```

更具体的配置可以参考例子。