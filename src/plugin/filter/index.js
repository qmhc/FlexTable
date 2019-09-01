/**
 * @name Filter
 * @description 表格数据过滤
 */

import {
  temp,
  theadTemp,
  trTemp,
  thTemp,
  spanTemp,
  inputTemp
} from 'core/temps'
import { getType, createSelect, html2Element } from '@/utils'

import './style.scss'

export default class Filter {
  constructor (tableInstance, options) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const filterable = getType(options.filter) === 'object'

    if (filterable) {
      const { filterAll, filterOpen, openAction } = options.filter

      state.filter = {
        filterAll: filterAll === true, // 设置是否默认所有列都添加筛选
        filterOpen: filterOpen === true,
        openAction: openAction !== false,
        filterable
      }
    } else {
      state.filter = {
        filterable
      }
    }

    this.state = state.filter

    // this._defaultFilterOptions = [
    //   { type: 'text' },
    //   { type: 'number' },
    //   { type: 'check' },
    //   { type: 'date', dateType: 'datetime-local' },
    //   { type: 'select', options: [] }
    // ]
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.filterable
  }

  create () {
    const { filterable, filterAll, filterOpen, openAction } = this.state
    const { table, columnProps } = this.tableInstance
    const tbodyGroup = table.querySelector('.it-tbody-group')

    const filterGroup = theadTemp.cloneNode()
    const tr = trTemp.cloneNode()

    const defaultFilter = {
      able: filterable && filterAll,
      type: 'text',
      vaule: undefined,
      method: this._defaultTextFilter
    }

    filterGroup.classList.add('filter', 'resize')

    for (const i in columnProps) {
      const props = columnProps[i]
      const { width, filter, accessor, id, className } = props
      const th = thTemp.cloneNode()

      th.style.cssText = `flex: ${width} 0 auto; width: ${width}px`

      if (getType(className) === 'string') {
        th.classList.add(className)
      }

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
          const [min, max] = filter
          props.filter = {
            ...defaultFilter,
            value: [~~min, ~~max],
            method: this._defaultNumberFilter
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
        let filterControl = null

        switch (type) {
          case 'text': {
            filterControl = this._renderTextControl(id)
            break
          }
          case 'number': {
            filterControl = this._renderNumberControl(id)
            break
          }
          case 'select': {
            filterControl = this._renderSelectControl(id)
            break
          }
          case 'date': {
            filterControl = this._renderDateControl(id)
            break
          }
          case 'check': {
            filterControl = this._renderCheckControl(id)
            break
          }
          default: {
            throw new Error(`You may be lost 'type' or defined error 'type' in your filter options.`)
          }
        }

        th.appendChild(filterControl)
      } else {
        th.innerHTML = ''
      }

      // 原始读取器
      props.reflectAccessor = accessor
      tr.appendChild(th)
    }

    filterGroup.appendChild(tr)

    if (openAction) {
      const action = temp.cloneNode()

      action.className = 'it-filter-action'

      const arrow = spanTemp.cloneNode()

      arrow.textContent = '≡'
      arrow.className = 'it-arrow'
      action.appendChild(arrow)

      if (filterOpen) {
        action.classList.add('open')
        tr.classList.add('open')
        filterGroup.style.zIndex = 1
      }

      action.addEventListener('click', () => {
        if (action.classList.contains('open')) {
          action.classList.remove('open')
          tr.classList.remove('open')
          filterGroup.style.zIndex = ''

          this.state.filterOpen = false
        } else {
          action.classList.add('open')
          tr.classList.add('open')

          setTimeout(() => {
            filterGroup.style.zIndex = 1
          }, 300)

          this.state.filterOpen = true
        }
      })

      filterGroup.appendChild(action)
    } else {
      tr.classList.add('no-action')
      filterGroup.style.zIndex = 1
    }

    tbodyGroup.parentNode.insertBefore(filterGroup, tbodyGroup)
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
    let resultCount = 0

    for (const props of columnProps) {
      const { filter, reflectAccessor, key } = props
      const { able, value, method } = filter

      let valueFlag

      if (getType(value) === 'array') {
        valueFlag = getType(value[0]) === 'number' && getType(value[1]) === 'number'
      } else {
        valueFlag = value || value === 0
      }

      props.accessor = reflectAccessor

      if (able && getType(method) === 'function' && valueFlag) {
        const resultData = []

        for (const i in filterData) {
          const rowData = filterData[i]
          const reflectValue = reflectAccessor(rowData)

          const originValue = key ? rowData[key] : null

          const result = method(reflectValue, value, originValue, rowData)

          if (result === true) {
            resultData.push(rowData)
            resultCount++
          }
        }

        filterData = resultData

        if (resultCount) {
          props.accessor = this._getPorxyAccessor(reflectAccessor, value)
        }
      }
    }

    this.filterData = filterData
    this.filterValueChange = false

    return filterData
  }

  dispatchChange () {
    this.filterValueChange = true
  }

  _defaultTextFilter (value, filter) {
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

  _getProps (id) {
    const { columnProps } = this.tableInstance
    return columnProps.find(props => props.id === id)
  }

  _renderTextControl (id) {
    const props = this._getProps(id)

    const control = temp.cloneNode()
    control.className = 'it-filter'

    const textInput = inputTemp.cloneNode()
    textInput.setAttribute('type', 'text')

    let timer = 0
    textInput.addEventListener('input', () => {
      clearTimeout(timer)

      timer = setTimeout(() => {
        const value = textInput.value
        props.filter.value = value

        this.filterValueChange = true
        this.tableInstance.refresh()

        if (getType(this.tableInstance.scrollTo) === 'function') {
          this.tableInstance.scrollTo(0, 0)
        }
      }, 300)
    })

    control.appendChild(textInput)
    return control
  }

  _renderDateControl (id) {
    const props = this._getProps(id)

    const { dateType } = props.filterOptions

    const control = temp.cloneNode()
    control.className = 'it-filter'

    const dateInput = inputTemp.cloneNode()
    dateInput.setAttribute('type', dateType || 'date')

    dateInput.addEventListener('change', () => {
      const value = dateInput.value
      props.filter.value = value

      this.filterValueChange = true
      this.tableInstance.refresh()
    })

    control.appendChild(dateInput)
    return control
  }

  _renderNumberControl (id) {
    const props = this._getProps(id)

    props.filter.value = getType(props.filter.value) === 'array' ? props.filter.value : new Array(2)

    const control = temp.cloneNode()
    control.className = 'it-filter'

    const minNumberInput = inputTemp.cloneNode()
    minNumberInput.setAttribute('type', 'number')
    minNumberInput.setAttribute('placeholder', 'min')

    minNumberInput.addEventListener('change', () => {
      const value = minNumberInput.value
      props.filter.value[0] = value !== '' ? +value : undefined
      this.filterValueChange = true
      this.tableInstance.refresh()
    })

    const maxNumberInput = inputTemp.cloneNode()
    maxNumberInput.setAttribute('type', 'number')
    maxNumberInput.setAttribute('placeholder', 'max')

    maxNumberInput.addEventListener('change', () => {
      const value = maxNumberInput.value
      props.filter.value[1] = value !== '' ? +value : undefined
      this.filterValueChange = true
      this.tableInstance.refresh()
    })

    control.appendChild(minNumberInput)
    control.appendChild(maxNumberInput)

    return control
  }

  _renderSelectControl (id) {
    const props = this._getProps(id)

    const options = props.filter.options || []
    options.unshift('')

    const control = temp.cloneNode()
    control.className = 'it-filter'

    const select = createSelect(options)

    select.addEventListener('change', ev => {
      const value = ev.newValue
      props.filter.value = value

      this.filterValueChange = true
      this.tableInstance.refresh()
    })

    control.appendChild(select)

    return control
  }

  _renderCheckControl (id) {
    const props = this._getProps(id)

    const control = temp.cloneNode()
    control.className = 'it-filter'

    const checkbox = inputTemp.cloneNode()
    checkbox.setAttribute('type', 'checkbox')
    checkbox.addEventListener('change', () => {
      const checked = checkbox.checked
      props.filter.value = checked
      this.filterValueChange = true
      this.tableInstance.refresh()
    })

    control.appendChild(checkbox)
    return control
  }

  // 未对日期类型进行特殊处理
  _getPorxyAccessor (accessor, filterValue) {
    switch (getType(filterValue)) {
      // 如果是 number 类型则整个高亮
      case 'array': return (rowData) => {
        const value = accessor(rowData)
        const html = (value === 0 || value) ? `<span class="it-highlight">${value}</span>` : '&nbsp;'
        return html2Element(html)
      }
      // 如果是 check 类型则不做操作
      case 'boolean': return accessor
    }

    const keyWords = '(' + filterValue.trim().toLowerCase().split(/\s+/g).sort(
      (prev, next) => next.length - prev.length
    ).join('|') + ')'

    return (rowData) => {
      const value = accessor(rowData)

      // 如果是对象, 说明用户进行了额外的自定义处理, 则直接返回
      if (typeof value === 'object') {
        return value
      }

      const html = (value === 0 || value) ? value.toString().replace(new RegExp(keyWords, 'ig'), `<span class="it-highlight">$1</span>`) : '&nbsp;'
      const element = html2Element(html)

      return element || ''
    }
  }

  _createFilterIcon (size = 18, color = 'black') {
    const wrapper = temp.cloneNode()

    wrapper.className = 'it-icon it-icon-filter'
    wrapper.style.width = `${size}px`
    wrapper.style.height = `${size}px`

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    filter.setAttribute('viewBox', '0 0 1024 1024')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

    path.setAttribute('d', 'M237.714286 237.714286v47.177143l214.089143 214.198857A18.285714 18.285714 0 0 1 457.142857 512v208.128l109.714286 54.857143V512a18.285714 18.285714 0 0 1 5.339428-12.909714L786.285714 284.891429V237.714286h-548.571428z m182.857143 281.856L206.482286 305.408a18.285714 18.285714 0 0 1-5.339429-12.909714V219.428571a18.285714 18.285714 0 0 1 18.285714-18.285714h585.142858a18.285714 18.285714 0 0 1 18.285714 18.285714v73.069715a18.285714 18.285714 0 0 1-5.339429 12.909714L603.428571 519.570286V804.571429a18.285714 18.285714 0 0 1-26.477714 16.347428l-146.285714-73.142857A18.285714 18.285714 0 0 1 420.571429 731.428571v-211.858285z')
    path.setAttribute('fill', color)

    filter.appendChild(path)
    filter.style.width = `${size}px`
    filter.style.height = `${size}px`

    wrapper.appendChild(filter)

    return wrapper
  }
}
