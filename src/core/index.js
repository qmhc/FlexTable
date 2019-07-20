import Renderer from './render'
import PluginConfig from '../plugin/config'

export default class FlexTable {
  static defaultColumnWidth = 100
  static plugins = []

  static registerPlugin (name, construct) {
    this.plugins.push({
      name,
      construct
    })
  }

  constructor ({ data = [], columns, container, theme, ...props }) {
		// 获取容器
		switch (typeof container) {
			case 'string': {
        this.container = document.querySelector(container)
				if (!this.container) {
					console.error(`Node for selector '${container}' is not defined.`)
					return false
        }
        break
      }
			case 'object': {
        this.container = container
        break
      }
			default: {
        console.error(`Parameter 'container' must be a String or a HTMLObject.`)
				return false
      }
    }

		// 数据克隆
    this.data = props.deepClone === true ? deepClone(data) : [...data]

    this.columns = columns

    // 初始化 this.table
    Renderer.call(this, { ...props })
    
		const fragment = document.createDocumentFragment();
		const table = this.table

		// 设置主题
		switch (theme) {
			case 'blue': table.classList.add('theme-blue'); break;
			case 'red': table.classList.add('theme-red'); break;
			case 'dark': table.classList.add('theme-dark'); break;
			default: table.classList.add('theme-light');
		}

		fragment.appendChild(table);
		this.container.appendChild(fragment);
  }

  registerMethod (name, method, ...args) {
    if (this[name]) {
      throw new Error(`Method '${name}' is esixt`)
    }
    this[name] = method.bind(this, ...args)
  }
}

for (let i = 0, len = PluginConfig.length; i < len; i++) {
  const name = PluginConfig[i]
  try {
    const module = require(`../plugin/${name}`)
    FlexTable.registerPlugin(name, module.default)
  } catch (e) {
    console.error(e)
  }
}
