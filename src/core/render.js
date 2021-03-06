import { getUuid, getType, renderElement, setClassName } from '@/utils'
import {
  temp,
  tableTemp,
  theadTemp,
  tbodyTemp,
  thTemp,
  trGroupTemp,
  trTemp,
  tdTemp
} from './temps'

// 渲染主函数
export default function render (options) {
  const plugins = [...this.constructor.plugins]
  const { id, className, rowClassName, stripe } = options

  this.state = {}
  this.plugins = []

  switch (getType(rowClassName)) {
    case 'null':
    case 'undefined': {
      break
    }
    case 'string':
    case 'array':
    case 'object': {
      this.rowClassName = () => rowClassName
      break
    }
    case 'function': {
      this.rowClassName = rowClassName
      break
    }
    default: {
      console.warn(`Illegal 'rowClassName' property type.`)
    }
  }

  // 建立数据索引
  for (let i = 0, len = this.data.length; i < len; i++) {
    const rowData = this.data[i]
    if (!rowData._itId) {
      rowData._itId = getUuid()
    }
  }

  // 插件实例化
  // constructor 钩子 (实例化)
  for (let i = 0, len = plugins.length; i < len; i++) {
    const { name, construct: Constructer } = plugins[i]
    const instance = new Constructer(this, options.plugins || {})
    this.plugins.push({
      name,
      instance
    })
  }

  // afterContrcut 钩子 (实例化后)
  // 其作用在于, 如果插件需要基于 FlexTable 的完整 state 进行处理时, 可在此钩子内进行
  for (let i = 0, len = this.plugins.length; i < len; i++) {
    const plugin = this.plugins[i].instance

    if (plugin.afterContruct) {
      plugin.afterContruct()
    }
  }

  // 表格结构生成
  const wrapper = temp.cloneNode()
  wrapper.className = 'flex-table'
  wrapper.style.visibility = 'hidden'
  this.table = wrapper

  if (stripe !== false) {
    wrapper.classList.add('stripe')
  }

  if (id && getType(id) === 'string') wrapper.setAttribute('id', id)
  if (className) {
    setClassName(wrapper, className)
  }

  const table = tableTemp.cloneNode()
  wrapper.appendChild(table)

  const theadGroup = theadTemp.cloneNode()
  const theadChild = theadTemp.cloneNode()
  const tbodyGroup = temp.cloneNode()
  const tbody = tbodyTemp.cloneNode()

  tbodyGroup.className = 'it-tbody-group'
  tbodyGroup.appendChild(tbody)

  // 渲染表头, 该方法会配置 useFooter 和 columnProps
  const { groupTr, childTr } = renderHeader.apply(this)

  const column = this.columnProps.length
  const tableMinWidth = column * this.constructor.defaultColumnWidth

  theadGroup.appendChild(groupTr)
  theadGroup.style.minWidth = `${tableMinWidth}px`

  table.style.minWidth = `${tableMinWidth}px`
  table.appendChild(theadGroup)

  if (childTr) {
    theadGroup.classList.add('group')
    theadChild.classList.add('shadow')
    theadChild.appendChild(childTr)
    theadChild.style.minWidth = `${tableMinWidth}px`
    table.appendChild(theadChild)
  } else {
    theadGroup.classList.add('shadow')
  }

  table.appendChild(tbodyGroup)

  const afterCreateHooks = []

  // 加载插件
  for (let i = 0, len = this.plugins.length; i < len; i++) {
    const plugin = this.plugins[i].instance
    const disabled = !plugin.shouldUse()

    if (disabled) {
      continue
    }

    if (plugin.beforeCreate) {
      plugin.beforeCreate()
    }

    plugin.create()

    if (plugin.bindEvent) {
      plugin.bindEvent()
    }

    if (plugin.afterCreate) {
      afterCreateHooks.push(plugin.afterCreate.bind(plugin))
    }
  }

  // 渲染表主体
  renderBodyStruct.apply(this)
  renderBodyData.apply(this)

  // 暴露表格主体渲染方法
  // 使用 setTimeout 方法让表格的 refresh 方法尽量靠后执行, 并防止重复执行
  let refreshTimer = 0
  let refreshData = false
  let refreshStruct = false
  let refreshCancel = false

  const refreshCallbacks = []
  const defaultOptions = {
    data: true,
    struct: false
  }

  this.registerMethod('refresh', (options = {}) => {
    clearTimeout(refreshTimer)

    options = {
      ...defaultOptions,
      ...options
    }

    const { data, struct, callback } = options

    if (!refreshData && data === true) {
      refreshData = true
    }

    if (!refreshStruct && struct === true) {
      refreshStruct = true
    }

    if (getType(callback) === 'function') {
      refreshCallbacks.push(callback)
    }

    // 让 refresh 尽量晚执行
    refreshTimer = setTimeout(() => {
      if (refreshCancel === true) {
        refreshCancel = false
        return false
      }

      if (refreshStruct === true) {
        renderBodyStruct.apply(this)
        refreshStruct = false
      }

      if (refreshData === true) {
        renderBodyData.apply(this)
        renderFooter.apply(this, [true])
        refreshData = false
      }

      if (refreshCallbacks.length) {
        const copies = Array.from(refreshCallbacks)

        refreshCallbacks.length = 0
        window.requestAnimationFrame(() => {
          for (let i = 0, len = copies.length; i < len; i++) {
            copies[i]()
          }
        })
      }
    }, 0)
  })

  // 渲染表脚
  if (this.state.useFooter) {
    const tfootGroup = temp.cloneNode()
    tfootGroup.className = 'it-tfoot'

    const footTr = renderFooter.apply(this)

    if (footTr) {
      tfootGroup.appendChild(footTr)
    }

    table.appendChild(tfootGroup)
  }

  // 创建后钩子
  for (let i = 0, len = afterCreateHooks.length; i < len; i++) {
    afterCreateHooks[i]()
  }
}

// 头部列渲染
function renderColumn (column) {
  column.id = column.id || getUuid()

  const { id, name, className, accessor, footer, defaultWidth, children, key } = column
  const th = thTemp.cloneNode()

  const content = temp.cloneNode()
  content.className = 'it-head-content'

  renderElement(content, name, this.dangerous)

  th.appendChild(content)
  th.itColumnId = id
  const width = defaultWidth || this.constructor.defaultColumnWidth
  th.style.cssText = `flex: ${width} 0 auto; width: ${width}px`

  if (className) {
    setClassName(th, className)
  }

  let _accessor

  switch (getType(accessor)) {
    case 'undefined': {
      _accessor = rowData => rowData[key]
      break
    }
    case 'string': {
      _accessor = rowData => rowData[accessor]
      break
    }
    case 'function': {
      _accessor = accessor
      break
    }
    default: {
      throw new Error('A column has illegal accessor')
    }
  }

  return {
    ...column,
    id,
    key,
    footer: footer ? (getType(footer) === 'function' ? footer : () => footer) : () => '',
    accessor: _accessor,
    width,
    target: th,
    parent: !!(children && children.length),
    hasFooter: !!footer
  }
}

// 表头渲染
function renderHeader () {
  const columns = this.columns
  let columnProps = []
  const groupTr = trTemp.cloneNode()
  const childTr = trTemp.cloneNode()

  let hasChilds = false
  let useFooter = false

  for (let i = 0, len = columns.length; i < len; i++) {
    const column = columns[i]
    const props = renderColumn.call(this, column)
    columnProps.push(props)

    const groupTh = props.target
    groupTr.appendChild(groupTh)

    if (props.parent) {
      hasChilds = true

      const childrenIds = []
      const { children } = column
      let width = 0

      for (let j = 0, len = children.length; j < len; j++) {
        const column = children[j]
        column.parentTarget = groupTh
        const props = renderColumn.call(this, column)
        columnProps.push(props)

        const childTh = props.target
        childTr.appendChild(childTh)
        width += props.width
        childrenIds.push(props.id)
      }

      groupTh.style.cssText = `flex: ${width} 0 auto; width: ${width}px`
      groupTh.itChildrenSize = children.length
      groupTh.itChildrenIds = childrenIds
    }
  }

  if (hasChilds) {
    columnProps = columnProps.filter(props => !props.parent)
  }

  for (let i = 0, len = columnProps.length; i < len; i++) {
    const props = columnProps[i]
    props.index = parseInt(i)
    if (props.hasFooter) useFooter = true
  }

  this.columnProps = columnProps
  this.state.useFooter = useFooter

  return { groupTr, childTr: hasChilds ? childTr : null }
}

// 表格主体渲染
function renderBodyStruct () {
  const { table, data, plugins, columnProps } = this
  const fragment = document.createDocumentFragment()

  const afterHookFns = []
  // beforeRenderBody 钩子 (表格结构变化)
  let length = data.length

  for (let i = 0, len = plugins.length; i < len; i++) {
    const plugin = plugins[i].instance
    const disabled = !plugin.shouldUse()

    if (!disabled && plugin.beforeRenderBody) {
      length = plugin.beforeRenderBody(length) || length
    }

    if (plugin.afterRenderBody) {
      afterHookFns.unshift(plugin.afterRenderBody.bind(plugin))
    }
  }

  const tbody = table.querySelector('.it-tbody')
  const trGroups = tbody.querySelectorAll('.it-tr-group')

  if (trGroups.length) {
    // 结构变化
    const currentLength = trGroups.length

    if (length > currentLength) {
      // 增加行数
      const count = length - currentLength
      const groupTemp = tbody.querySelector('.it-tr-group:first-child')

      for (let i = 0; i < count; i++) {
        const group = groupTemp.cloneNode(true)
        group.rowIndex = currentLength + parseInt(i)
        fragment.appendChild(group)
      }

      tbody.appendChild(fragment)
    } else {
      // 减少行数
      const deleteTrGroups = tbody.querySelectorAll(`.it-tr-group:nth-child(n+${length + 1})`)

      for (let i = 0, len = deleteTrGroups.length; i < len; i++) {
        const trGroup = deleteTrGroups[i]
        tbody.removeChild(trGroup)
      }
    }
  } else {
    // 初始化渲染
    const ths = table.querySelectorAll('.it-thead.shadow .it-th')

    for (let i = 0; i < length; i++) {
      // const rowData = data[i] || {};
      const group = trGroupTemp.cloneNode()
      const tr = trTemp.cloneNode()
      tr.rowIndex = parseInt(i)

      for (let j = 0, len = columnProps.length; j < len; j++) {
        const td = tdTemp.cloneNode()
        const th = ths[j]

        const width = parseFloat(th.style.width)
        td.style.cssText = `flex: ${width} 0 auto; width: ${width}px`

        td.rowIndex = parseInt(i)
        td.columnIndex = parseInt(j)

        const props = columnProps[j]

        if (props.className) {
          setClassName(td, props.className)
        }

        tr.appendChild(td)
      }

      group.appendChild(tr)
      fragment.appendChild(group)
    }

    tbody.appendChild(fragment)
  }

  // afterRenderBody 钩子
  // for (const callback of afterHookFns) callback(length)
  for (let i = 0, len = afterHookFns.length; i < len; i++) {
    afterHookFns[i](length)
  }
}

// 渲染数据方法
function renderBodyData () {
  const { table, plugins, columnProps, dangerous } = this

  const afterHookFns = []
  // beforeRenderData 钩子
  const originData = this.data
  let data = originData

  for (let i = 0, len = plugins.length; i < len; i++) {
    const plugin = plugins[i].instance
    const disabled = !plugin.shouldUse()

    if (!disabled && plugin.beforeRenderData) {
      data = plugin.beforeRenderData(data) || data
    }

    if (plugin.afterRenderData) {
      afterHookFns.unshift(plugin.afterRenderData.bind(plugin))
    }
  }

  this.state.computedData = data || originData

  const tbody = table.querySelector('.it-tbody')
  const trGroups = tbody.querySelectorAll('.it-tr-group')

  for (let i = 0, len = trGroups.length; i < len; i++) {
    const trGroup = trGroups[i]
    const tr = trGroup.querySelector('.it-tr')

    if (data[i]) {
      const rowData = data[i] || {}
      const tds = tr.querySelectorAll('.it-td')

      if (!rowData._itId) {
        rowData._itId = getUuid()
      }

      tr.itRowId = rowData._itId

      if (this.rowClassName) {
        setClassName(trGroup, this.rowClassName(rowData, i))
      }

      for (let j = 0, len = columnProps.length; j < len; j++) {
        const props = columnProps[j]
        const { accessor } = props
        const td = tds[j]

        if (td._itLock === true) {
          continue
        }

        const result = accessor(rowData, props)
        const html = (result === 0 || result) ? result : ''

        renderElement(td, html, dangerous)
      }
    } else {
      const tds = tr.querySelectorAll('.it-td')

      for (let i = 0, len = columnProps.length; i < len; i++) {
        const td = tds[i]

        if (td._itLock === true) {
          continue
        }

        td.innerHTML = ''
      }

      tr.itRowId = undefined
    }
  }

  // afterRenderData 钩子
  // for (const callback of afterHookFns) callback(data)
  for (let i = 0, len = afterHookFns.length; i < len; i++) {
    afterHookFns[i](data)
  }
}

// 表格脚部渲染
function renderFooter (refresh = false) {
  if (!this.state.useFooter) {
    return null
  }

  const { columnProps, dangerous } = this
  const data = this.state.computedData

  const columnData = new Map()

  for (let i = 0, len = columnProps.length; i < len; i++) {
    columnData.set(i, [])
  }

  for (let i = 0, len = data.length; i < len; i++) {
    const rowData = data[i]
    for (let j = 0, len = columnProps.length; j < len; j++) {
      const props = columnProps[j]

      let { accessor, reflectAccessor } = props

      accessor = reflectAccessor || accessor
      columnData.get(j).push(accessor(rowData, props))
    }
  }

  let tr

  if (refresh) {
    tr = this.table.querySelector('.it-tfoot > .it-tr')
  } else {
    tr = trTemp.cloneNode()
  }

  for (let i = 0, len = columnProps.length; i < len; i++) {
    const { footer, width } = columnProps[i]

    const result = footer(columnData.get(i))
    const title = result || ''

    let content

    if (refresh) {
      content = tr.querySelector(`.it-td:nth-of-type(${i + 1}) .it-foot-content`)
      renderElement(content, title, dangerous)
    } else {
      const td = tdTemp.cloneNode()
      td.style.cssText = `flex: ${width} 0 auto; width: ${width}px`

      content = temp.cloneNode()
      content.className = 'it-foot-content'

      renderElement(content, title, dangerous)

      td.appendChild(content)
      tr.appendChild(td)
    }
  }

  return tr
}
