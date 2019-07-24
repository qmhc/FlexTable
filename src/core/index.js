import FlexTable from './class'
import PluginConfig from '../plugin/config'

import '../style/itable.scss'

// 注册插件
for (let i = 0, len = PluginConfig.length; i < len; i++) {
  const name = PluginConfig[i]
  try {
    const module = require(`../plugin/${name}`)
    FlexTable.registerPlugin(name, module.default)
  } catch (e) {
    console.warn(e)
  }
}

export default FlexTable
