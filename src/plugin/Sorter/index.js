/**
 * @name Sorter
 * @description 表格数据排序
 */

import { getKeyState, registerKey, isKeyRegistered } from 'core/events'
// import { addEventWhiteList, dispatchEvent } from 'core/events'
import { getType, sortByProps, checkPathByClass } from '@/utils'

import './style.scss'

const multipleKeyWhiteList = {
  ctrl: 17,
  shift: 16,
  alt: 18
}

for (const name in multipleKeyWhiteList) {
  const code = multipleKeyWhiteList[name]
  if (!isKeyRegistered(code)) {
    registerKey(code)
  }
}

export default class Sorter {
  constructor (tableInstance, options) {
    this.tableInstance = tableInstance

    const { state } = this.tableInstance

    const able = getType(options.sorter) === 'object'

    if (able) {
      const { multiple, multipleKey } = options.sorter

      const keyName = getType(multipleKey) === 'string' ? multipleKey.toLowerCase() : ''

      state.sorter = {
        able,
        sortBy: [], // 记录列id
        types: [], // 0 normal | 1 asc | 2 desc
        sortData: undefined,
        multiple: multiple === true,
        multipleKey: Object.keys(multipleKeyWhiteList).includes(keyName) ? multipleKeyWhiteList[keyName] : multipleKeyWhiteList.shift
        // cache: cache === true // 多列排序缓存, 在与分页插件的结合上存在一些问题, 暂不实现
      }

      // addEventWhiteList.apply(this.tableInstance, ['columnSort'])
    } else {
      state.sorter = {
        able
      }
    }

    this.state = state.sorter
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.able
  }

  beforeRenderData (data) {
    if (this.created) {
      const { able, sortBy } = this.state

      if (able && typeof sortBy[0] !== 'undefined') {
        data = this._getSortData(data)
      }

      return data
    }
  }

  create () {
    const { table, columnProps } = this.tableInstance
    const ths = table.querySelectorAll('.it-thead.shadow .it-th')

    const { able, sortBy, types } = this.state

    for (let i = 0, len = ths.length; i < len; i++) {
      const props = columnProps[i]
      const { sort, id } = props
      const defaultSort = {
        able,
        type: 0,
        method: this._defaultSortMethod
      }

      switch (getType(sort)) {
        case 'number':
        case 'string': {
          props.sort = {
            ...defaultSort,
            type: parseInt(sort)
          }
          break
        }
        case 'boolean': {
          props.sort = {
            ...defaultSort,
            able: sort
          }
          break
        }
        case 'function': {
          props.sort = {
            ...defaultSort,
            method: sort
          }
          break
        }
        case 'object': {
          props.sort = {
            ...defaultSort,
            ...sort
          }
          break
        }
        default: {
          props.sort = {
            ...defaultSort
          }
        }
      }

      const th = ths[i]
      th.classList.add('it-sort')

      const type = props.sort.type % 3

      if (type) {
        sortBy.push(id)
        types.push(type)

        if (type === 1) {
          th.classList.add('asc')
        } else {
          th.classList.add('desc')
        }
      }

      if (!props.sortable) {
        th.classList.add('disabled')
      }
    }

    // if (this.state.cache) {
    //   this.cacheData = new Map()
    // }

    this.created = true

    // if (sortBy.length) {
    //   this.tableInstance.refresh()
    // }
  }

  bindEvent () {
    const { table, columnProps } = this.tableInstance

    table.addEventListener('click', evt => {
      if (this.tableInstance._isLock()) {
        return false
      }

      const path = evt.path

      let target = null

      if (path) {
        target = path.find(value => value.classList && value.classList.contains('it-sort'))
      } else {
        target = evt.target || evt.srcElement
        target = checkPathByClass(target, 'it-sort')
      }

      if (target) {
        const id = target.itColumnId

        if (!id) {
          return false
        }

        const props = columnProps.find(value => value.id === id)

        if (props.sort && props.sort.able) {
          let { sortBy, types, multiple, multipleKey } = this.state

          let sortIndex = 0

          if (multiple && typeof sortBy[0] !== 'undefined' && (sortBy.length !== 1 || sortBy[0] !== id) && getKeyState(multipleKey)) {
            const targetIndex = sortBy.findIndex(value => value === id)

            if (targetIndex !== -1) {
              sortIndex = targetIndex
              types[sortIndex] = (types[sortIndex] + 1) % 3

              if (!types[sortIndex]) {
                sortBy.splice(sortIndex, 1)
                types.splice(sortIndex, 1)
                target.classList.remove('asc', 'desc')
              }
            } else {
              sortIndex = sortBy.push(id) - 1
              types[sortIndex] = 1
            }
          } else {
            if (sortBy.length > 1 || sortBy[sortIndex] !== id) {
              this.state.sortBy = [id]
              this.state.types = [0]
            }

            table.querySelectorAll('.asc, .desc').forEach(
              value => value.classList.remove('asc', 'desc')
            )

            sortBy = this.state.sortBy
            types = this.state.types
            types[sortIndex] = (types[sortIndex] + 1) % 3

            if (!types[sortIndex]) {
              sortBy[sortIndex] = undefined
            } else {
              switch (types[sortIndex]) {
                case 1: {
                  target.classList.add('asc')
                  break
                }
                case 2: {
                  target.classList.add('desc')
                  break
                }
              }
            }
          }

          this.tableInstance.refresh()
        }
      }
    })
  }

  _getSortData (data) {
    const { table, columnProps } = this.tableInstance
    const { sortBy, types } = this.state
    const sortHandlers = table.querySelectorAll('.it-sort')

    const optinos = sortBy.map(
      (value, index) => {
        const props = columnProps.find(item => item.id === value)
        const type = types[index] === 1 ? 'asc' : 'desc'
        const { accessor, sort, index: key, reflectAccessor } = props

        switch (types[index]) {
          case 1: {
            sortHandlers[key].classList.add('asc')
            break
          }
          case 2: {
            sortHandlers[key].classList.add('desc')
            break
          }
        }

        sort.type = type

        return {
          type,
          accessor: reflectAccessor || accessor, // 使用原始读取器排序
          sorter: sort.method,
          params: [props] // 额外参数
        }
      }
    )

    return sortByProps(data, optinos)
  }

  _defaultSortMethod (prev, next) {
    if (typeof prev === 'number' && typeof next === 'number') {
      return prev - next
    }

    return prev.toString().localeCompare(next)
  }
}
