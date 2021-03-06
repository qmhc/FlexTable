import FlexTable from './class'
import PluginConfig from '../plugin/config'

// 注册插件
for (let i = 0, len = PluginConfig.length; i < len; i++) {
  const name = PluginConfig[i]
  try {
    const module = require(`../plugin/${name}`)
    FlexTable.registerPlugin(name, module.default)
  } catch (error) {
    console.warn(error)
  }
}

export default FlexTable
