/* eslint-disable */
/**
 * @name Expander
 * @description 表格行拓展插件
 */

import './style.scss'

export default class Plugin {
  constructor (tableInstance, options = {}) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance
  }

  // 实例化后可基于 FlexTable 的完整 state 进行处理
  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  // 判断插件是否该使用
  shouldUse () {
    return true
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
}
