import Renderer from './render'

export default class FlexTable {
  static defaultColumnWidth = 100
  static plugins = []

  /**
   * 为 FlexTable 注册插件
   * @param {String} name 插件的名称 (唯一的)
   * @param {Object} construct 插件的构造方法 (函数) (对象)
   * @param {Number} index 插件的位置, 默认添加至最后
   */
  static registerPlugin (name, construct, index = this.plugins.length) {
    if (this.plugins.find(plugin => plugin.name === name)) {
      throw new Error(`Plugin named '${name}' has been registered`)
    }

    if (index >= this.plugins.length) {
      this.plugins.push({
        name,
        construct
      })
    } else {
      this.plugins.splice(index, 0, {
        name,
        construct
      })
    }
  }

  /**
   * 根据插件的名称或索引注销插件
   * @param {String|Number} name 插件的名称或索引
   * @returns {Boolean} 是否成功删除
   */
  static cancelPlugin (name) {
    let index

    if (typeof name === 'number') {
      if (name < -1 || name >= this.plugins.length) {
        return false
      }

      index = parseInt(name)
    } else {
      index = this.plugins.findIndex(plugin => plugin.name === name)
    }
    
    if (!~index) {
      this.plugins.splice(index, 1)
      return true
    }

    return false
  }

  /**
   * 根据插件名称替换插件
   * @param {String} name 需要喜欢的插件名称
   * @param {Object} construct 插件的新构造方法 (函数) (对象)
   */
  static replacePlugin (name, construct) {
    const index = this.plugins.findIndex(plugin => plugin.name === name)

    if (!~index) {
      this.plugins[index] = {
        name,
        construct
      }
    }
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

    // this.container.style.visibility = 'hidden'

    const style = document.createElement('style')
    style.innerHTML = `
      .flex-table * {
        transition: none !important
      }
    `
    document.body.appendChild(style)

		// 数据克隆
    this.data = props.deepClone === true ? deepClone(data) : [...data]

    this.columns = columns

    // 初始化 this.table
    Renderer.call(this, { ...props })
    
		const fragment = document.createDocumentFragment()

		// 设置主题
		switch (theme) {
			case 'blue': {
        this.table.classList.add('theme-blue')
        break
      }
			case 'red': {
        this.table.classList.add('theme-red')
        break
      }
			case 'dark': {
        this.table.classList.add('theme-dark')
        break
      }
			default: {
        this.table.classList.add('theme-light')
      }
		}

		fragment.appendChild(this.table)
    this.container.appendChild(fragment)
    
    // 优化首屏渲染效果
    setTimeout(() => {
      this.table.style.visibility = 'visible'
    }, 16)

    setTimeout(() => {
      document.body.removeChild(style)
    }, 150)
  }

  /**
   * 为 FlexTable 实例注册方法
   * @param {String} name 方法的名称 (唯一的)
   * @param {Function} method 方法的函数体
   * @param {Boolean} bind 是否将 this 绑定为 FlexTable 实例
   * @param  {...any} args 需要传入方法的参数
   */
  registerMethod (name, method, bind = true, ...args) {
    if (this[name]) {
      throw new Error(`Method '${name}' has been registered`)
    }
    if (bind) {
      this[name] = method.bind(this, ...args)
    } else {
      this[name] = () => {
        return method(...args)
      }
    }
  }
}
