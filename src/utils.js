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
		button.setAttribute('disabled', '');
	} else {
		button.removeAttribute('disabled');
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
	for (let i in options) {
		const option = options[i]
		if (typeof option !== 'object') {
			options[i] = {
				title: option.toString(),
				value: option,
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
		enumerable : true,
		configurable : true
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

	for (let i in options) {
		const option = options[i]
		const { title, value } = option
		const li = liTemp.cloneNode()
		li.textContent = title || ''
		li.value = value
		li.itValue = value
		li.index = i
		if (i == defaultIndex) {
			div.itValue = value
			div.value = value
			li.classList.add('current')
		}
		ul.itOptions.push(li)
		ul.appendChild(li)
	}

	down.appendChild(ul)
	div.appendChild(down)

	down.addEventListener('click', ev => {
		const evt = ev || event
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
		const { top, height } = divStyle

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

	div.addEventListener('click', () => {
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
    value => getType(value) === 'object' ? value : { key: value, sorter: defaultSortMethod, type: 'asc' }
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
      for (let prop of props) {
				const { sorter, type, accessor } = prop
				
        let desc = type === 'desc'
				const result = sorter(accessor(prev), accessor(next))
				
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
	let random1 = 0, random2
	for (let i = 0; i < 36; i++) {
		switch (i) {
			case 8:
			case 13:
			case 18:
			case 23: uuid[i] = '-'; break
			case 14: uuid[i] = '4'; break
			default: {
				if (random1 <= 0x02) random1 = 0x2000000 + (Math.random() * 0x1000000) | 0
				random2 = random1 & 0xf
				random1 = random1 >> 4
				uuid[i] = CHARS[(i === 19)? (random2 & 0x3)|0x8: random2]
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
    case 'object': _root = {}; break
    case 'array': _root = []; break
    default: return obj
  }

  // 循环数组栈
  const loopList = [
    {
      parent: _root,
      key: undefined,
      data: obj
    }
  ]

  while (loopList.length) {
    // 先入后出，深度优先
    const node = loopList.pop()
    const { parent, key, data } = node
    const type = getType(data)

    // 初始化克隆对象_root
    let res = parent
    if (getType(key) !== 'undefined') {
      res = parent[key] = type === 'array' ? [] : {}
    }

    for (let i in data) {
      let _data = data[i]
      let _type = getType(_data)
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
