/**
 * @name pager
 * @description 表格数据分页
 */

import {
  temp,
  spanTemp,
  buttonTemp,
  inputTemp
} from 'core/temps'
import { getType, toggleDisabled, createSelect } from '@/utils'

import './style.scss'

function getIndexRange ({ currentPage, pageSize }) {
  const startIndex = (currentPage - 1) * pageSize || 0
  const endIndex = currentPage * pageSize
  return { startIndex, endIndex }
}

function renderPagination () {
  const { data } = this.tableInstance
  const { pageOptions, currentPage, pageSize, useOptions } = this.state

  const wrapper = temp.cloneNode()
  wrapper.className = 'it-pagination'

  const prev = temp.cloneNode()
  const center = temp.cloneNode()
  const next = temp.cloneNode()

  prev.className = 'it-prev'
  center.className = 'it-info'
  next.className = 'it-next'

  // 页码控件
  const page = spanTemp.cloneNode()
  page.className = 'it-page'
  const input = inputTemp.cloneNode()
  input.setAttribute('type', 'number')
  input.className = 'it-input'
  input.value = currentPage

  // 翻页控件
  const prevButton = buttonTemp.cloneNode()
  const nextButton = buttonTemp.cloneNode()

  prevButton.textContent = this.labels.prev
  prevButton.setAttribute('disabled', '')
  prevButton.addEventListener('click', () => {
    if (prevButton.getAttribute('disabled')) {
      return false
    }
    this.changePage(--input.value)
    // changButtonState();
  })
  this.prevButton = prevButton

  nextButton.textContent = this.labels.next
  nextButton.addEventListener('click', () => {
    if (nextButton.getAttribute('disabled')) {
      return false
    }
    this.changePage(++input.value)
  })

  this.nextButton = nextButton

  prev.appendChild(prevButton)
  next.appendChild(nextButton)

  // 控制页码范围
  input.addEventListener('input', () => {
    const { pageSize } = this.state
    const maxPage = Math.ceil(this.dataTotal / pageSize) || 1
    const targetPage = input.value
    input.value = targetPage < 1 ? 1 : targetPage > maxPage ? maxPage : targetPage
  })

  // 跳转到对应页面
  input.addEventListener('blur', () => {
    const targetPage = input.value
    const { currentPage } = this.state
    if (targetPage === currentPage) return
    this.changePage(targetPage)
    // changButtonState();
  })

  // 总页数记录
  const totalPage = spanTemp.cloneNode()
  totalPage.textContent = ' / ' + (Math.ceil(data.length / pageSize) || 1)
  this.totalPage = totalPage
  page.appendChild(input)
  page.appendChild(totalPage)
  center.appendChild(page)

  // 分页控件
  if (useOptions) {
    const sizeSelect = spanTemp.cloneNode()
    sizeSelect.className = 'it-size-select'
    const select = createSelect(pageOptions.map(value => ({ title: `${value} ${this.labels.row}`, value })), 0, 'top')
    select.itValue = pageSize

    select.addEventListener('change', ev => {
      // 分页改变
      const targetSize = +ev.newValue
      const { pageSize, currentPage } = this.state
      // const tbody =  table[target].target.querySelector('.it-tbody');
      const dataIndex = (currentPage - 1) * pageSize + 1

      // 重新计算页码数
      const computedCurrentPage = Math.ceil(dataIndex / targetSize)
      input.value = computedCurrentPage
      totalPage.textContent = ' / ' + (Math.ceil(data.length / targetSize) || 1)
      this.state.pageSize = targetSize
      this.state.currentPage = computedCurrentPage

      // 调整表格结构
      this.tableInstance.refreshStruct()

      // 重填数据
      this.tableInstance.refresh()
    })

    sizeSelect.appendChild(select)
    center.appendChild(sizeSelect)
  }

  wrapper.appendChild(prev)
  wrapper.appendChild(center)
  wrapper.appendChild(next)

  return wrapper
}

function changePage (targetPage) {
  targetPage = targetPage > 0 ? targetPage : 1

  this.state.currentPage = targetPage
  this.tableInstance.refresh()
}

export default class Pager {
  constructor (tableInstance, options) {
    this.tableInstance = tableInstance

    this.changePage = changePage.bind(this)
    this.renderTraget = renderPagination.bind(this)

    const { state } = this.tableInstance

    const pageable = getType(options.pager) === 'object'

    if (pageable) {
      const { useOptions, pageOptions, pageSize, currentPage } = options.pager

      const labels = options.pager.labels || {}

      this.labels = {
        prev: 'Prev',
        next: 'Next',
        row: 'Row',
        ...labels
      }

      state.pager = {
        pageable,
        useOptions: useOptions !== false,
        pageOptions: getType(pageOptions) === 'array' ? [...pageOptions] : [10, 20, 50, 100],
        currentPage: currentPage || 1,
        pageSize: pageSize || 10
      }
    } else {
      state.pager = {
        pageable
      }
    }

    this.state = state.pager
  }

  afterContruct () {
    this.globalState = this.tableInstance.state
  }

  shouldUse () {
    return this.state.pageable
  }

  beforeRenderBody () {
    return this.state.pageSize
  }

  beforeRenderData (data) {
    const { startIndex, endIndex } = getIndexRange(this.state)

    this.dataTotal = data.length || 0
    this.computeTotalPage()

    if (this.created) {
      this.changButtonState()
    }

    return data.slice(startIndex, endIndex)
  }

  create () {
    const pagination = temp.cloneNode()
    pagination.className = 'it-bottom'
    pagination.appendChild(this.renderTraget())

    if (this.tableInstance.table) {
      this.tableInstance.table.appendChild(pagination)
    }

    this.created = true
  }

  changButtonState () {
    const { startIndex, endIndex } = getIndexRange(this.state)
    // console.log({ startIndex, endIndex, total: this.dataTotal });
    toggleDisabled(this.prevButton, startIndex <= 0)
    toggleDisabled(this.nextButton, endIndex >= this.dataTotal)
  }

  getPageInfo () {
    const { currentPage, pageSize } = this.state
    return { currentPage, pageSize }
  }

  computeTotalPage () {
    const { dataTotal, totalPage } = this
    const { pageSize } = this.state

    if (totalPage) {
      totalPage.textContent = ' / ' + (Math.ceil(dataTotal / pageSize) || 1)
    }
  }
}
