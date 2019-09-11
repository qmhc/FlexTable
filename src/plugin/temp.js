/* eslint-disable */
// import './style.scss'

export default class Plugin {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance
    // 从 options 获取配置项里相关信息, 处理后存入 tableInstance.state
    // 存入 state 时, 应在 state 中创建一个插件的命名空间
    // 例如 tableInstance.state.myPlugin = { ...someState }

    const able = Object.prototype.toString.call(options.plugin) === '[object Object]'

    if (able) {
      // 有效配置, 在此处初始化 state
      state.plugin = { able }
    } else {
      state.plugin = { able }
    }

    this.state = state.plugin
  }

  // 实例化后可基于 FlexTable 的完整 state 进行处理
  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  // 判断插件是否该使用
  shouldUse () {
    return this.state.able
  }

  // 根据表格行数进行处理, 并返回新行数
  beforeRenderBody (count) {
    return count
  }

  // 根据表格数据进行处理, 并返回新数据
  beforeRenderData (data) {
    return data
  }

  beforeCreate () {}

  create () {
    // create code
    this.created = true
  }

  bindEvent () {}

  afterCreate () {
    if (this.created) {}
  }

  // 根据表格行数进行处理
  afterRenderBody (count) {
    if (this.created) {}
  }

  // 根据表格数据进行处理
  afterRenderData (data) {
    if (this.created) {}
  }

  // 表格添加到 document 后
  afterRender () {}
}
