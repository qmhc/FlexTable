/**
 * 根据环境判断该使用点击事件还是触摸事件
 */
export function getClickEventName () {
  const hasWindow = (typeof window !== 'undefined')
  const hasNavigator = (typeof navigator !== 'undefined')
  const useTouch = hasWindow && ('ontouchstart' in window || (hasNavigator && navigator.msMaxTouchPoints > 0))

  return useTouch ? 'touchstart' : 'click'
}

const clickEventName = getClickEventName()

export function prependChild (target, child) {
  target.insertBefore(child, target.firstChild)
}

export function getStyle (obj) {
  if (window.getComputedStyle) {
    return window.getComputedStyle(obj, null)
  } else {
    return obj.currentStyle
  }
}

export function toggleDisabled (button, disabled) {
  if (disabled) {
    button.setAttribute('disabled', '')
  } else {
    button.removeAttribute('disabled')
  }
}

export function checkPathByClass (node, className) {
  if (!node.parentNode) return null
  if (node.classList.contains(className)) return node
  while (node.parentNode) {
    node = node.parentNode
    if (node === document.body) return null
    if (node.classList.contains(className)) return node
  }
  return null
}

/**
 * 创建一个 Select 模版
 * @param {Array} options 候选项列表 { title, value } 当 title 和 value 一样时可直接传入字符串
 * @param {*} defaultIndex 默认选项的索引值
 */
export function createSelect (options, defaultIndex = -1, placement = 'bottom') {
  for (let i = 0, len = options.length; i < len; i++) {
    const option = options[i]
    if (getType(option) !== 'object') {
      options[i] = {
        title: option.toString(),
        value: option
      }
    }
  }

  const div = document.createElement('div')
  const down = div.cloneNode()
  div.className = 'it-select'
  down.className = 'it-dropdown'

  const span = document.createElement('span')
  span.textContent = ''
  div.appendChild(span)

  let _value = ''

  Reflect.defineProperty(div, 'itValue', {
    get () {
      return _value
    },
    set (newValue) {
      if (_value !== newValue) {
        const newOption = options.find(opt => opt.value === newValue)
        span.textContent = (newOption && newOption.title) || ''
        _value = newValue
        div.value = newValue

        const current = ul.querySelector('li.it-item.current')

        if (current) {
          current.classList.remove('current')
        }

        for (let i = 0, len = ul.itOptions.length; i < len; i++) {
          if (ul.itOptions[i].itValue === newValue) {
            ul.itOptions[i].classList.add('current')
            break
          }
        }

        return true
      }
    },
    enumerable: true,
    configurable: true
  })

  const ul = document.createElement('ul')
  ul.className = 'it-option'

  if (placement === 'top') {
    ul.classList.add('top')
    div.classList.add('top')
  }

  const liTemp = document.createElement('li')
  liTemp.className = 'it-item'

  ul.itOptions = []

  for (const i in options) {
    const option = options[i]
    const {
      title,
      value
    } = option
    const li = liTemp.cloneNode()
    li.textContent = title || ''
    li.value = value
    li.itValue = value
    li.index = i

    if (i.toString() === defaultIndex.toString()) {
      div.itValue = value
      div.value = value
      li.classList.add('current')
    }

    ul.itOptions.push(li)
    ul.appendChild(li)
  }

  down.appendChild(ul)
  div.appendChild(down)

  down.addEventListener(clickEventName, evt => {
    const target = evt.target || evt.srcElement

    if (target.classList.contains('it-item')) {
      const newValue = target.itValue
      if (div.itValue === newValue) return

      // const current = ul.querySelector('li.it-item.current')
      // if (current) current.classList.remove('current')

      // const newTitle = target.textContent
      const optionIndex = target.index

      // 定义事件
      const event = new Event('change')
      event.oldValue = div.itValue
      event.newValue = newValue
      event.optionIndex = optionIndex
      div.dispatchEvent(event)

      div.itValue = newValue
      // div.value = newValue
      // target.classList.add('current')
    }
  })

  ul.addEventListener('scroll', ev => {
    ev.stopPropagation()
  })

  ul.addEventListener('wheel', ev => {
    ev.stopPropagation()
  })

  let showOption = false

  div.closeOptions = () => {
    down.style.opacity = 0

    div.classList.remove('show')
    // down.classList.remove('show')
    ul.classList.remove('show')

    setTimeout(() => {
      down.style.visibility = 'hidden'
      div.isOptionsOpen = false
    }, 300)
  }

  div.openOptions = () => {
    const divStyle = getStyle(div)
    const {
      top,
      height
    } = divStyle

    if (ul.classList.contains('top')) {
      down.style.top = ''
      down.style.bottom = `${parseFloat(top) + parseFloat(height) + 2}px`
    } else {
      div.classList.remove('top')
      down.style.top = `${parseFloat(top) + parseFloat(height) + 2}px`
      down.style.bottom = ''
    }

    setTimeout(() => {
      ul.style.transition = ''
      down.style.visibility = 'visible'

      down.style.opacity = 1

      div.classList.add('show')
      ul.classList.add('show')

      div.isOptionsOpen = true
    }, 10)
  }

  div.addEventListener(clickEventName, () => {
    if (showOption) {
      div.closeOptions()
    } else {
      div.openOptions()
    }

    showOption = !showOption
  })

  return div
}

/**
 * 创建一个自定义的 checkbox
 * @param {String} label 复选框的 label
 * @param {Boolean} value 复选框的值
 */
export function createCheckbox (title = undefined, value = false) {
  const wrapper = document.createElement('label')
  wrapper.className = 'it-checkbox'

  const input = document.createElement('input')
  input.setAttribute('type', 'checkbox')
  input.className = 'it-checkbox-input'
  input.checked = value === true

  const checkbox = document.createElement('span')
  checkbox.className = 'it-checkbox-switch'

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 12 10')

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  polyline.setAttribute('points', '1.5 6 4.5 9 10.5 1')

  svg.appendChild(polyline)
  checkbox.appendChild(svg)
  checkbox.appendChild(input)
  wrapper.appendChild(checkbox)

  Reflect.defineProperty(wrapper, 'checked', {
    get () {
      return input.checked
    },
    set (val) {
      if (val === true) {
        input.checked = true
        wrapper.classList.add('checked')
      } else {
        input.checked = false
        wrapper.classList.remove('checked')
      }
    }
  })

  input.addEventListener('change', evt => {
    // 由于外层也派送 change 事件, 不阻止冒泡则会派送两次
    evt.stopPropagation()

    const event = new Event('change')

    wrapper.checked = input.checked
    event.checked = input.checked

    wrapper.dispatchEvent(event)
  })

  if (title) {
    const label = document.createElement('span')
    label.className = 'it-checkbox-label'
    label.textContent = title
    wrapper.appendChild(label)
  }

  return wrapper
}

/**
 * 获取变量类型
 * @param {any} any 任意变量
 */
export function getType (any) {
  return Object.prototype.toString.call(any).replace(/\[object\s(.+)\]/, '$1').toLowerCase()
}

/**
 * 根据依赖的属性逐层排序
 * @param {Array} obj 需要排序的数组
 * @param {Object|String} props 排序依赖的属性 key-属性名 sorter-排序方法 accessor-数据获取方法 type-升降序
 */
export function sortByProps (obj, props) {
  if (!obj.sort || !props.length) {
    return obj
  }

  const sortObj = [...obj]
  const defaultSortMethod = (a, b) => a.toString().localeCompare(b)

  if (getType(props) !== 'array') {
    props = [props]
  }

  props = props.map(
    value => getType(value) === 'object' ? value : {
      key: value,
      sorter: defaultSortMethod,
      type: 'asc'
    }
  ).map(
    value => {
      if (getType(value.accessor) !== 'function') {
        value.accessor = data => data[value.key]
      }

      if (getType(value.sorter) !== 'function') {
        value.sorter = defaultSortMethod
      }

      return value
    }
  )

  sortObj.sort(
    (prev, next) => {
      const results = []
      for (const prop of props) {
        const {
          sorter,
          type,
          accessor
        } = prop

        const params = prop.params || [] // 传入读取器的额外参数
        const desc = type === 'desc'
        const result = sorter(accessor(prev, ...params), accessor(next, ...params))

        results.push(desc ? -result : result)
        // 若不为0则无需进行下一层排序
        if (result) {
          break
        }
      }
      return results.pop() || 0
    }
  )

  return sortObj
}

// 简单 (非深度) 去重
export function getUniqueArray (array) {
  return [...new Set(array)]
}

// 生成uuid (v4)
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'.split('') // ABCDEFGHIJKLMNOPQRSTUVWXYZ

export function getUuid () {
  const uuid = new Array(36)
  let random1 = 0
  let random2
  for (let i = 0; i < 36; i++) {
    switch (i) {
      case 8:
      case 13:
      case 18:
      case 23:
        uuid[i] = '-'
        break
      case 14:
        uuid[i] = '4'
        break
      default: {
        if (random1 <= 0x02) random1 = 0x2000000 + (Math.random() * 0x1000000) | 0
        random2 = random1 & 0xf
        random1 = random1 >> 4
        uuid[i] = CHARS[(i === 19) ? (random2 & 0x3) | 0x8 : random2]
      }
    }
  }

  return uuid.join('')
}

/**
 * 深度拷贝对象或数组 (避免一层死循环)
 * @param {Object|Array} obj 需要拷贝的对象或数组
 */
export function deepClone (obj) {
  const type = getType(obj)

  // 类型校验
  let _root
  switch (type) {
    case 'object':
      _root = {}
      break
    case 'array':
      _root = []
      break
    default:
      return obj
  }

  // 循环数组栈
  const loopList = [{
    parent: _root,
    key: undefined,
    data: obj
  }]

  while (loopList.length) {
    // 先入后出，深度优先
    const node = loopList.pop()
    const {
      parent,
      key,
      data
    } = node
    const type = getType(data)

    // 初始化克隆对象_root
    let res = parent
    if (getType(key) !== 'undefined') {
      res = parent[key] = type === 'array' ? [] : {}
    }

    for (const i in data) {
      const _data = data[i]
      const _type = getType(_data)
      if (type === 'array' || (type === 'object' && Object.prototype.hasOwnProperty.call(data, i))) {
        // 避免一层死循环
        if (_data === data) {
          res[i] = res
        } else if (_type === 'object' || _type === 'array') {
          loopList.push({
            parent: res,
            key: i,
            data: _data
          })
        } else {
          res[i] = _data
        }
      }
    }
  }

  return _root
}

/**
 * 将html字符串转换成Element对象
 * @param {String} html 可以解析的html字符串
 */
export function html2Element (html) {
  const span = document.createElement('span')
  try {
    span.innerHTML = html
  } catch (e) {
    return null
  }
  const children = span.childNodes
  if (children && children.length) {
    return children
  }
  return null
}

/**
 * 根据不同的 html 类型渲染
 * @param {HTMLElement} node 需要渲染的 node 对象
 * @param {Number|String|Array|NodeList|HTMLElement} html 需要渲染的 html
 * @param {Boolean} dangerous 是否可以直接插入字符串 html
 */
export function renderElement (node, html, dangerous = false) {
  node.innerHTML = ''

  switch (getType(html)) {
    case 'number':
    case 'string': {
      if (dangerous === true) {
        node.innerHTML = html
      } else {
        node.textContent = html
      }
      break
    }
    case 'array':
    case 'nodelist': {
      const fragment = document.createDocumentFragment()

      html = [...html]

      for (let i = 0, len = html.length; i < len; i++) {
        let element = html[i]
        if (getType(element) === 'string') {
          element = document.createTextNode(element)
        }
        fragment.appendChild(element)
      }

      node.appendChild(fragment)
      break
    }
    default: {
      node.appendChild(html)
    }
  }
}

/**
 * 为 element 设置类名
 * @param {HTMLElement} node 需要设置类名的 element
 * @param {String|Array|Object} className 需要设置的类名
 */
export function setClassName (node, className) {
  const type = getType(className)

  switch (type) {
    case 'string': {
      if (className) {
        node.classList.add(className)
      }

      return true
    }
    case 'array': {
      for (let i = 0, len = className.length; i < len; i++) {
        node.classList.add(className[i])
      }

      return true
    }
    case 'object': {
      for (const name in className) {
        if (className[name]) {
          node.classList.add(name)
        } else {
          node.classList.remove(name)
        }
      }

      return true
    }
  }

  return false
}

/**
 * 为 html 对象设置动画效果
 * @param {HTMLElement} element 需要动画的 html 对象
 * @param {Object} styles 需要进行动画的样式
 * @param {Function} callback 动画完成后的回调函数
 */
export function animate (element, styles, callback) {
  if (getType(styles) !== 'object') {
    return false
  }

  const raf = window.requestAnimationFrame || window.setTimeout

  const fromStyles = []
  const toStyles = []

  for (const name in styles) {
    const value = styles[name]

    let from
    let to

    switch (getType(value)) {
      case 'number':
      case 'string': {
        from = window.getComputedStyle(element)[name]
        to = value
        break
      }
      case 'array': {
        from = value[0]
        to = value[1]
        break
      }
      case 'object': {
        from = value.from || window.getComputedStyle(element)[name]
        to = value.to
        break
      }
      default: {
        continue
      }
    }

    fromStyles.push({
      name,
      value: from
    })

    toStyles.push({
      name,
      value: to
    })
  }

  raf(() => {
    for (let i = 0, len = fromStyles.length; i < len; i++) {
      const { name, value } = fromStyles[i]
      element.style[name] = value
    }

    if (getType(callback) === 'function') {
      // 添加防抖, 防止多属性变化导致多次回调
      let timer = 0
      const transitionEnd = () => {
        clearTimeout(timer)

        timer = setTimeout(() => {
          element.removeEventListener('transitionend', transitionEnd)
          callback(element)
        }, 36)
      }

      element.addEventListener('transitionend', transitionEnd)
    }

    raf(() => {
      for (let i = 0, len = toStyles.length; i < len; i++) {
        const { name, value } = toStyles[i]
        element.style[name] = value
      }
    })
  })
}

/**
 * 使用钩子函数为 html 添加动画效果
 * @param {HTMLElement} element 需要动画的 html 对象
 * @param {Object} hooks 控制动画效果的钩子函数
 */
export function animateByHooks (element, hooks) {
  const raf = window.requestAnimationFrame || window.setTimeout

  const { before, start, finish, after } = hooks

  if (getType(before) === 'function') {
    before(element)
  }

  raf(() => {
    if (getType(start) === 'function') {
      start(element)
    }

    if (getType(after) === 'function') {
      const transitionEnd = () => {
        element.removeEventListener('transitionend', transitionEnd)
        after(element)
      }

      element.addEventListener('transitionend', transitionEnd)
    }

    raf(() => {
      if (getType(finish) === 'function') {
        finish(element)
      }
    })
  })
}
