import { inputTemp } from 'core/temps'
import { createSelect } from '@/utils'

export class TextControl {
  constructor () {
    this.el = inputTemp.cloneNode()

    this.el.setAttribute('type', 'text')
    this.el.classList.add('it-editor-control')
  }

  onEdit (value = '') {
    this.el.value = value
  }

  onSave () {
    const value = this.el.value
    const number = parseFloat(value)

    if (!Number.isNaN(number)) {
      return number
    }

    return value
  }

  onCancel () {}

  onError () {
    this.el.classList.add('error')
  }

  onFinish () {
    this.el.classList.remove('error')
  }
}

export class NumberControl {
  constructor () {
    this.el = inputTemp.cloneNode()

    this.el.setAttribute('type', 'number')
    this.el.classList.add('it-editor-control')
  }

  onEdit (value = '') {
    this.el.value = value
  }

  onSave () {
    return parseFloat(this.el.value)
  }

  onCancel () {}

  onError () {
    this.el.classList.add('error')
  }

  onFinish () {
    this.el.classList.remove('error')
  }
}

export class SelectControl {
  constructor ({ options }) {
    this.el = createSelect(options)

    this.el.classList.add('it-editor-control')
  }

  onEdit (value = '') {
    this.el.value = value
    this.el.itValue = value
  }

  onSave () {
    return this.el.value
  }

  onCancel () {}

  onError () {
    this.el.classList.add('error')
  }

  onFinish () {
    this.el.classList.remove('error')
  }
}
