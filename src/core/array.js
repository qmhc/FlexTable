function defineProxy (_root, handler) {
  const leverag = { origin: _root }
  const loopList = [leverag]

  while (loopList.length) {
    const object = loopList.pop()
    const keys = Object.keys(object)

    let i = 0

    while (i < keys.length) {
      const prop = object[keys[i]]
      if (typeof prop === 'object') {
        loopList.push(prop)

        object[keys[i]] = new Proxy(prop, handler)
      }

      ++i
    }
  }

  return leverag.origin
}

export default class ProxyArray {
  constructor (array = [], observer) {
    if (typeof observer !== 'function') {
      return array
    }

    let pending = false

    const _observer = () => {
      pending = false
      observer()
    }

    let timerFunc

    if (typeof Promise !== 'undefined') {
      const next = Promise.resolve()
      timerFunc = () => {
        next.then(_observer)
      }
    } else {
      timerFunc = () => {
        setTimeout(_observer, 0)
      }
    }

    const handler = {
      set (target, key, value, proxy) {
        if (typeof value === 'object') {
          value = defineProxy(value, handler)
        }

        Reflect.set(target, key, value, proxy)

        if (!pending) {
          pending = true
          timerFunc()
        }

        return true
      }
    }

    return defineProxy(array, handler)
  }
}
