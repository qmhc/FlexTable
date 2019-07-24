import Renderer from './render'

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

  registerMethod (name, method, bind = true, ...args) {
    if (this[name]) {
      throw new Error(`Method '${name}' is esixt`)
    }
    if (bind) {
      this[name] = method.bind(this, ...args)
    } else {
      this[name] = () => {
        method(...args)
      }
    }
  }
}
