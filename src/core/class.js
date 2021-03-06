import Renderer from './render'
import ProxyArray from './array'
import { addEventWhiteList, registerEvent, unregisterEvent, dispatchEvent, subscribeResize, clickEventName } from './events'
import { deepClone } from '../utils'

import '../style/itable.scss'

class FlexTable {
  static defaultColumnWidth = 100

  static plugins = []

  static _clickEventName = clickEventName

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
   * @param {String} name 需要替换的插件名称
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

  constructor ({ data = [], columns, container, dangerous, theme, ...props }) {
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

    const style = document.createElement('style')
    style.innerHTML = `
      .flex-table * {
        transition: none !important
      }
    `
    document.body.appendChild(style)

    this.columns = columns
    this.observeData = props.observeData !== false

    if (typeof props.deepClone === 'boolean') {
      this.deepClone = props.deepClone
    } else {
      if (data.length < 500) {
        this.deepClone = true
      } else {
        this.deepClone = false
      }
    }

    const observer = () => {
      if (this.observeData && this.refresh) {
        this.refresh({ data: true, struct: true })
      }
    }

    if (this.observeData) {
      let _data = new ProxyArray(data, observer)

      Reflect.defineProperty(this, 'data', {
        get () {
          return _data
        },
        set (value) {
          if (this.deepClone) {
            // 数据克隆
            _data = new ProxyArray(deepClone(value), observer)
          } else {
            _data = new ProxyArray(value, observer)
          }
        }
      })

      this.data = data
    } else {
      this.data = this.deepClone ? deepClone(data) : Array.from(data)
    }

    // 事件属性初始化
    this.eventWhiteList = new Set()
    this.events = {}

    subscribeResize(this)

    this.registerMethod('on', registerEvent)
    this.registerMethod('off', unregisterEvent)

    this.dangerous = dangerous === true

    // 表格是否处于锁定状态
    // 有一些插件在运作中, 出于安全需要对表格进行锁定, 防止与其他插件冲突 (例如: Resizer)
    // 插件在进行工作前, 出于安全, 应该先检查表格的锁定状态
    const locks = new Set()

    addEventWhiteList.apply(this, ['lock', 'unlock'])

    this.registerMethod('_lock', asker => {
      if (locks.size === 0) {
        dispatchEvent.call(this, 'lock')
      }

      locks.add(asker)
    })

    this.registerMethod('_unlock', asker => {
      locks.delete(asker)

      if (locks.size === 0) {
        dispatchEvent.call(this, 'unlock')
      }
    })

    this.registerMethod('_isLock', () => {
      return locks.size > 0
    })

    // 初始化 this.table
    // 注册 refresh 和 refreshStruch 两个方法
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

    const MutationObserver = window.MutationObserver

    // 监听 table 是否添加到 document 中
    if (MutationObserver) {
      let observer = new MutationObserver(mutationList => {
        for (const mutation of mutationList) {
          if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length) {
            const addedNodes = [...mutation.addedNodes]

            const table = addedNodes.find(element => {
              if (element === this.table) {
                return true
              }

              if (element.querySelectorAll) {
                const tables = element.querySelectorAll('.flex-table')

                for (let i = 0, len = tables.length; i < len; i++) {
                  if (tables[i] === this.table) {
                    return true
                  }
                }
              }

              return false
            })

            if (table) {
              observer.disconnect()
              observer = null

              setTimeout(() => {
                this.handleRendered()
              }, 100)
            }
          }
        }
      })

      observer.observe(document, { childList: true, subtree: true })
    }

    fragment.appendChild(this.table)
    this.container.appendChild(fragment)

    // 优化首屏渲染效果
    setTimeout(() => {
      this.table.style.visibility = 'visible'
    }, 56)

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
  registerMethod (name, method, bind = true, ...bindArgs) {
    if (this[name]) {
      throw new Error(`Method '${name}' has been registered`)
    }
    if (bind) {
      this[name] = method.bind(this, ...bindArgs)
    } else {
      this[name] = (...args) => method(...bindArgs, ...args)
    }
  }

  /**
   * 通知插件 table 已添加到 document 中
   */
  handleRendered () {
    for (let i = 0, len = this.plugins.length; i < len; i++) {
      const plugin = this.plugins[i].instance

      if (plugin.afterRender) {
        plugin.afterRender()
      }
    }
  }

  destroy () {
    try {
      this.container.removeChild(this.table)
    } catch (err) {
      console.warn(err)
    }

    this.container = null
    this.table = null
    this.plugin = null
  }
}

export default FlexTable
