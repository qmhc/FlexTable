import { isNative } from './index'

let pending = false
const callbacks = []

function flushCallbacks () {
  pending = false

  const copies = Array.from(callbacks)

  callbacks.length = 0

  let i = 0
  while (i < copies.length) {
    copies[i++]()
  }
}

let timerFunc

if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const next = Promise.resolve()

  timerFunc = () => {
    next.then(flushCallbacks)
  }
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export default function nextTick (callback, context = null) {
  callbacks.push(() => {
    if (typeof callback === 'function') {
      try {
        callback.call(context)
      } catch {}
    }
  })

  if (!pending) {
    pending = true
    timerFunc()
  }
}
