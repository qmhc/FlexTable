/**
 * @name Filter
 * @description 表格数据过滤
 */

import {
  temp,
  theadTemp,
  spanTemp,
  inputTemp
} from 'core/temps'
import { registerClickOutside } from 'core/events'
import { getType, checkPathByClass, html2Element, animate, createCheckbox } from '@/utils'

import './style.scss'

// FIXME: 分离 Control 对象
export default class Filter {
  constructor (tableInstance, options) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const filterable = getType(options.filter) === 'object'

    if (filterable) {
      const { filterAll, highlight } = options.filter

      state.filter = {
        filterAll: filterAll === true, // 设置是否默认所有列都添加筛选
        highlight: highlight !== false,
        filterable
      }
    } else {
      state.filter = {
        filterable
      }
    }

    this.controls = []
    this.state = state.filter
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.filterable
  }

  create () {
    const { filterable, filterAll } = this.state
    const { table, columnProps } = this.tableInstance
    const theadItems = table.querySelectorAll('.it-thead.shadow > .it-tr .it-th')
    const filterGroup = theadTemp.cloneNode()

    const defaultFilter = {
      able: filterable && filterAll,
      type: 'text',
      vaule: undefined,
      method: this._defaultTextFilter
    }

    filterGroup.classList.add('filter', 'resize')

    for (let i = 0, len = theadItems.length; i < len; i++) {
      const props = columnProps[i]
      const { filter, id, accessor, reflectAccessor } = props

      switch (getType(filter)) {
        case 'number':
        case 'string': {
          props.filter = {
            ...defaultFilter,
            value: filter.toString()
          }
          break
        }
        case 'boolean': {
          props.filter = {
            ...defaultFilter,
            able: filter
          }
          break
        }
        case 'function': {
          props.filter = {
            ...defaultFilter,
            method: filter
          }
          break
        }
        case 'array': {
          props.filter = {
            ...defaultFilter,
            value: [],
            method: this._defaultCheckFilter,
            options: filter
          }
          break
        }
        case 'object': {
          const _default = {
            ...defaultFilter
          }

          if (filter.type === 'number') {
            _default.method = this._defaultNumberFilter
          }

          if (filter.type === 'select') {
            _default.options = []
          }

          if (filter.type === 'check') {
            _default.options = []
            _default.method = this._defaultCheckFilter
          }

          props.filter = {
            ..._default,
            ...filter
          }

          break
        }
        default: {
          props.filter = {
            ...defaultFilter
          }
        }
      }

      const { able, type } = props.filter

      if (able) {
        const wrapper = temp.cloneNode()
        const icon = this._createFilterIcon(16, '')

        wrapper.className = 'it-filter-wrapper'
        wrapper.appendChild(icon)

        const container = temp.cloneNode()
        container.className = 'it-filter-container'

        const content = temp.cloneNode()
        content.className = 'it-filter-content'

        const arrow = temp.cloneNode()
        arrow.className = 'it-filter-arrow'

        const inner = temp.cloneNode()
        inner.className = 'it-filter-inner'

        content.appendChild(arrow)
        content.appendChild(inner)
        container.appendChild(content)

        wrapper.appendChild(container)

        registerClickOutside(wrapper)

        const instance = this._createControlInstance(wrapper)

        this.controls.push(instance)

        wrapper.addEventListener('click', event => {
          event.stopPropagation()

          this._hideAllControls()

          if (instance.active) {
            instance.hide()
          } else {
            instance.show()
          }
        })

        wrapper.addEventListener('clickoutside', () => {
          if (instance.active) {
            instance.hide()
          }
        })

        container.addEventListener('click', event => {
          event.stopPropagation()
        })

        const afterFilter = params => {
          const { value } = params

          let valueFlag

          if (getType(value) === 'array') {
            valueFlag = !!value.filter(item => (item || item === 0)).length
          } else {
            valueFlag = value || value === 0
          }

          if (valueFlag) {
            wrapper.classList.add('filter')
          } else {
            wrapper.classList.remove('filter')
          }

          this.filterValueChange = true
          this.tableInstance.refresh()

          if (getType(this.tableInstance.scrollTo) === 'function') {
            this.tableInstance.scrollTo(0, 0)
          }
        }

        let filterControl = null

        switch (type) {
          case 'text': {
            filterControl = this._renderTextControl(id, afterFilter)
            break
          }
          case 'number': {
            filterControl = this._renderNumberControl(id, afterFilter)
            break
          }
          case 'select': {
            filterControl = this._renderSelectControl(id, afterFilter)
            break
          }
          case 'date': {
            filterControl = this._renderDateControl(id, afterFilter)
            break
          }
          case 'check': {
            filterControl = this._renderCheckControl(id, afterFilter)
            break
          }
          default: {
            throw new Error(`You may be lost 'type' or defined error 'type' in your filter options.`)
          }
        }

        inner.appendChild(filterControl)
        theadItems[i].appendChild(wrapper)
      }

      props.reflectAccessor = reflectAccessor || accessor

      props.accessor = this._getPorxyAccessor(props.accessor)
    }

    this.created = true
  }

  beforeRenderData (data) {
    if (!this.created) {
      return data
    }

    if (!this.filterValueChange) {
      return this.filterData
    }

    const { columnProps } = this.tableInstance

    let filterData = data

    for (const props of columnProps) {
      const { accessor, filter, reflectAccessor, key } = props
      const { able, value, method } = filter

      let valueFlag

      if (getType(value) === 'array') {
        valueFlag = !!value.filter(item => (item || item === 0)).length
      } else {
        valueFlag = value || value === 0
      }

      // 记录原始的读取器
      const _accessor = reflectAccessor || accessor

      if (able && getType(method) === 'function' && valueFlag) {
        const resultData = []

        for (const i in filterData) {
          const rowData = filterData[i]
          const reflectValue = _accessor(rowData)

          const originValue = key ? rowData[key] : null

          if (typeof reflectValue === 'undefined') debugger
          const result = method(reflectValue, value, originValue, rowData)

          if (result === true) {
            resultData.push(rowData)
            // resultCount++
          }
        }

        filterData = resultData
      }
    }

    this.filterData = filterData
    this.filterValueChange = false

    return filterData
  }

  dispatchChange () {
    this.filterValueChange = true
  }

  _createControlInstance (element) {
    const container = element.querySelector('.it-filter-container')

    return {
      el: element,
      active: false,
      hide () {
        element.classList.remove('active')

        animate(container, { opacity: 0 }, () => {
          container.style.display = ''
          this.active = false
        })
      },
      show () {
        element.classList.add('active')
        container.style.display = 'block'

        animate(container, { opacity: 1 })

        this.active = true
      }
    }
  }

  _hideAllControls () {
    for (let i = 0, len = this.controls.length; i < len; i++) {
      const instance = this.controls[i]

      if (instance.active) {
        instance.hide()
      }
    }
  }

  _defaultTextFilter (value, filter) {
    if (typeof value === 'undefined') debugger
    const keyWords = filter.trim().toLowerCase().split(/\s+/g)
    value = value.toString().toLowerCase()

    for (const word of keyWords) {
      if (!value.includes(word)) return false
    }

    return true
  }

  _defaultNumberFilter (value, filter) {
    // 不合法数字全部转换为0
    // value = ~~value

    value = +value

    if (Number.isNaN(value)) {
      return false
    }

    const res = (typeof filter[0] !== 'number' || value >= filter[0]) && (typeof filter[1] !== 'number' || value <= filter[1])

    return res
  }

  _defaultCheckFilter (value, filter) {
    return filter.includes(value)
  }

  _getProps (id) {
    const { columnProps } = this.tableInstance
    return columnProps.find(props => props.id === id)
  }

  _renderTextControl (id, callback) {
    const props = this._getProps(id)
    const labelText = props.filter.label || props.name

    const control = temp.cloneNode()
    control.className = 'it-filter-control'

    const input = inputTemp.cloneNode()
    input.setAttribute('type', 'text')

    const label = spanTemp.cloneNode()
    label.className = 'it-filter-label left'
    label.textContent = labelText

    let timer = 0
    input.addEventListener('input', () => {
      clearTimeout(timer)

      timer = setTimeout(() => {
        const value = input.value
        props.filter.value = value

        if (getType(callback) === 'function') {
          callback(props.filter)
        }
      }, 300)
    })

    control.appendChild(label)
    control.appendChild(input)
    return control
  }

  _renderDateControl (id, callback) {
    const props = this._getProps(id)
    const labelText = props.filter.label || props.name

    const { dateType } = props.filter

    const control = temp.cloneNode()
    control.className = 'it-filter-control'

    const dateInput = inputTemp.cloneNode()
    dateInput.setAttribute('type', dateType || 'date')

    const label = spanTemp.cloneNode()
    label.className = 'it-filter-label left'
    label.textContent = labelText

    dateInput.addEventListener('change', () => {
      const value = dateInput.value
      props.filter.value = value

      if (getType(callback) === 'function') {
        callback(props.filter)
      }
    })

    control.appendChild(label)
    control.appendChild(dateInput)
    return control
  }

  _renderNumberControl (id, callback) {
    const props = this._getProps(id)

    let minText = 'Min'
    let maxText = 'Max'

    if (getType(props.filter.label) === 'array') {
      minText = props.filter.label[0] || minText
      maxText = props.filter.label[1] || maxText
    }

    props.filter.value = getType(props.filter.value) === 'array' ? props.filter.value : new Array(2)

    const control = temp.cloneNode()
    control.className = 'it-filter-control'

    const minInput = inputTemp.cloneNode()
    minInput.setAttribute('type', 'number')
    minInput.setAttribute('placeholder', 'min')
    minInput.style.marginBottom = '1em'

    const minLabel = spanTemp.cloneNode()
    minLabel.className = 'it-filter-label left'
    minLabel.textContent = minText

    minInput.addEventListener('change', () => {
      const value = minInput.value

      props.filter.value[0] = value !== '' ? +value : undefined

      if (getType(callback) === 'function') {
        callback(props.filter)
      }
    })

    const maxInput = inputTemp.cloneNode()
    maxInput.setAttribute('type', 'number')
    maxInput.setAttribute('placeholder', 'max')

    const maxLabel = spanTemp.cloneNode()
    maxLabel.className = 'it-filter-label left'
    maxLabel.textContent = maxText

    maxInput.addEventListener('change', () => {
      const value = maxInput.value

      props.filter.value[1] = value !== '' ? +value : undefined

      if (getType(callback) === 'function') {
        callback(props.filter)
      }
    })

    control.appendChild(minLabel)
    control.appendChild(minInput)
    control.appendChild(maxLabel)
    control.appendChild(maxInput)

    return control
  }

  _renderSelectControl (id, callback) {
    const props = this._getProps(id)

    const options = props.filter.options || []

    const control = temp.cloneNode()
    control.className = 'it-filter-control'
    control.style.padding = '.5em 0'

    const ul = document.createElement('ul')
    ul.className = 'it-option static show'

    const liTemp = document.createElement('li')
    liTemp.className = 'it-item'

    const reset = liTemp.cloneNode()
    reset.classList.add('current')
    reset.index = -1
    reset.textContent = '重置'
    reset.itValue = ''

    ul.appendChild(reset)

    for (let i = 0, len = options.length; i < len; i++) {
      let option = options[i]

      if (getType(option) !== 'object') {
        option = {
          title: option.toString(),
          value: option
        }
      }

      const { title, value } = option

      const li = liTemp.cloneNode()

      li.index = i
      li.textContent = title
      li.itValue = value

      ul.appendChild(li)
    }

    ul.addEventListener('click', event => {
      const path = event.path

      let target = null

      if (path) {
        target = path.find(value => value.classList && value.classList.contains('it-item'))
      } else {
        target = event.target || event.srcElement
        target = checkPathByClass(target, 'it-item')
      }

      if (target) {
        const current = ul.querySelector('.it-item.current')

        if (current) {
          current.classList.remove('current')
        }

        const value = target.itValue

        props.filter.value = value
        target.classList.add('current')

        if (getType(callback) === 'function') {
          callback(props.filter)
        }
      }

      return false
    })

    control.appendChild(ul)

    return control
  }

  _renderCheckControl (id, callback) {
    const props = this._getProps(id)

    const options = props.filter.options || []

    const control = temp.cloneNode()
    control.className = 'it-filter-control'

    const reset = temp.cloneNode()
    reset.className = 'it-filter-action'
    reset.textContent = '重置'

    const divide = temp.cloneNode()
    divide.className = 'it-divide'

    control.appendChild(reset)
    control.appendChild(divide)

    for (let i = 0, len = options.length; i < len; i++) {
      let option = options[i]

      if (getType(option) !== 'object') {
        option = {
          title: option.toString(),
          value: option
        }
      }

      const { title, value } = option

      const checkbox = createCheckbox(title)

      checkbox.addEventListener('change', () => {
        const checked = checkbox.checked

        if (!props.filter.value) {
          props.filter.value = []
        }

        if (checked) {
          props.filter.value.push(value)
        } else {
          const index = props.filter.value.findIndex(item => item === value)

          if (~index) {
            props.filter.value.splice(index, 1)
          }
        }

        if (getType(callback) === 'function') {
          callback(props.filter)
        }
      })

      control.appendChild(checkbox)
    }

    reset.addEventListener('click', () => {
      const checkboxes = control.querySelectorAll('.it-filter-control .it-checkbox.checked')

      for (let i = 0, len = checkboxes.length; i < len; i++) {
        const checkbox = checkboxes[i]
        checkbox.checked = false
      }

      props.filter.value = []

      if (getType(callback) === 'function') {
        callback(props.filter)
      }
    })

    return control
  }

  // 未对日期类型进行特殊处理
  _getPorxyAccessor (accessor) {
    return (rowData, props) => {
      const value = accessor(rowData)
      const filterValue = props.filter.value

      if (!filterValue) {
        return value
      }

      switch (getType(filterValue)) {
        case 'number':
        case 'string': {
          const keyWords = `(${
            filterValue.toString().trim().toLowerCase().split(/\s+/g).sort(
              (prev, next) => next.length - prev.length
            ).join('|')
          })`

          // 如果是对象, 说明用户进行了额外的自定义处理, 则直接返回
          if (typeof value === 'object') {
            return value
          }

          const html = (value === 0 || value) ? value.toString().replace(new RegExp(keyWords, 'ig'), `<span class="it-highlight">$1</span>`) : '&nbsp;'
          const element = html2Element(html)

          return element || ''
        }
        // 如果是数组类型则整个高亮
        case 'array': {
          if (filterValue.filter(item => (item || item === 0)).length) {
            const html = (value === 0 || value) ? `<span class="it-highlight">${value}</span>` : '&nbsp;'
            return html2Element(html)
          }

          return value
        }
        default: {
          return value
        }
      }
    }
  }

  _createFilterIcon (size = 16, color = 'black') {
    const wrapper = temp.cloneNode()

    wrapper.className = 'it-icon it-icon-filter'
    wrapper.style.width = `${size}px`
    wrapper.style.height = `${size}px`

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    filter.setAttribute('viewBox', '0 0 1024 1024')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

    path.setAttribute('d', 'M788.48 204.8H215.04c-19.456 0-28.672 21.504-16.384 35.84l247.808 292.864c8.192 9.216 11.264 21.504 11.264 33.792v232.448c0 10.24 10.24 19.456 20.48 19.456h45.056c10.24 0 18.432-9.216 18.432-19.456V568.32c0-13.312 5.12-24.576 14.336-33.792l248.832-292.864c12.288-14.336 3.072-36.864-16.384-36.864z')
    path.setAttribute('fill', color)

    filter.appendChild(path)
    filter.style.width = `${size}px`
    filter.style.height = `${size}px`

    wrapper.appendChild(filter)

    return wrapper
  }
}
