// 记录按键
const recorder = []

/**
 * 根据按键码获取按键状态
 * @param {Number} code 按键码
 */
export function getKeyState (code) {
  const key = recorder.find(item => item.code === code)

  if (key) {
    return key.state
  }

  return false
}

/**
 * 根据按键码注册按键监听
 * @param {Number} code 按键码
 */
export function registerKey (code) {
  if (recorder.find(item => item.code === code)) {
    throw new Error(`The Key coded '${code}' has been registered`)
  }

  recorder.push({
    state: false,
    code: code
  })
}

/**
 * 根据按键码判断是否注册了监听
 * @param {Number} code 按键码
 */
export function isKeyRegistered (code) {
  return !!~recorder.findIndex(item => item.code === code)
}

document.addEventListener('keydown', ev => {
  const code = ev.keyCode
  const key = recorder.find(item => item.code === code)
  if (key) {
    key.state = true
  }
})

document.addEventListener('keyup', ev => {
  const code = ev.keyCode
  const key = recorder.find(item => item.code === code)
  if (key) {
    key.state = false
  }
})

/**
 * 将事件名注册到白名单
 * this 须含有 eventWhiteList{Set} 和 events{Array} 属性
 * @param  {...String} events
 */
export function addEventWhiteList (...events) {
  for (let i = 0, len = events.length; i < len; i++) {
    const name = events[i]

    if (typeof name === 'string') {
      this.eventWhiteList.add(name.toLowerCase())
    }
  }
}

/**
 * 注册事件方法
 * this 须含有 eventWhiteList{Set} 和 events{Array} 属性
 * @param {String} name 事件名称
 * @param {Function} listener 监听回调函数
 */
export function registerEvent (name, listener) {
  name = name.toLowerCase()
  if (!this.eventWhiteList.has(name)) {
    return false
  }

  if (typeof listener === 'function') {
    if (!this.events[name]) {
      this.events[name] = []
    }

    this.events[name].push(listener)

    return true
  }

  return false
}

/**
 * 注销事件方法
 * this 须含有 eventWhiteList{Set} 和 events{Array} 属性
 * @param {String} name 事件名称
 * @param {Function} listener 监听回调函数
 */
export function unregisterEvent (name, listener) {
  name = name.toLowerCase()
  if (this.events[name]) {
    const events = this.events[name]

    for (let i = 0, len = events.length; i < len; i++) {
      if (events[i] === listener) {
        events.splice(i, 1)
        return true
      }
    }
  }

  return false
}

/**
 * 派送事件方法
 * this 须含有 eventWhiteList{Set} 和 events{Array} 属性
 * @param {String} name 事件名称
 * @param {Any} event 事件回调参数, 多参数时应使用 Object 或 Event
 */
export function dispatchEvent (name, event) {
  name = name.toLowerCase()
  if (this.events[name]) {
    const events = this.events[name]

    for (let i = 0, len = events.length; i < len; i++) {
      const listener = events[i]
      listener(event)
    }
  }
}
