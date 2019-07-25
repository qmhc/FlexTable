/**
 *	@name scroller
 *	@description 表格滚动条
 */

import { getType } from '@/utils'

import './style.scss'

export default class Scroller {
	constructor (tableInstance, options = {}) {
		this.tableInstance = tableInstance

		const { state } = this.tableInstance

		const scrollable = getType(options.scroller) === 'object'

		if (scrollable) {
			const { height, mouse, wheel, wheelDistance } = options.scroller

			state.scroller = {
				scrollable,
				height: height || 300,
				mouse: mouse !== false,
				wheel: wheel === true,
				wheelDistance: wheelDistance || 20,
				scrolling: false
			}
		} else {
			state.scroller = {
				scrollable
			}
		}

		this.state = state.scroller
	}

	afterContruct () {
		this.globalState = this.tableInstance.state
	}

	shouldUse() {
		if (this.state.native) {
			return false
		}
		return this.state.scrollable
	}
	
	beforeCreate () {
		const { table } = this.tableInstance
		const MutationObserver = MutationObserver || WebKitMutationObserver;

		if (MutationObserver) {
			const observer = new MutationObserver(mutationList => {
				for (let mutation of mutationList) {
					if (
						mutation.type === 'childList'
						&&
						mutation.addedNodes
						&&
						mutation.addedNodes.length
					) {
						const addedNodes = [...mutation.addedNodes]

						if (addedNodes.includes(table)) {
							const { height } = this.state
							const scroller = table.querySelector('.it-tbody-group')
							const tbody = scroller.querySelector('.it-tbody')

							setTimeout(() => {
								const tbodyHeight = tbody.getBoundingClientRect().height

								if (tbodyHeight < height) {
									tbody.style.transition = ''
									scroller.style.height = `${tbodyHeight}px`
									tbody.style.transform = 'translateY(0)'
									this.scroll = false
									this.start = 0
									this.distance = 0
									this.current = 0
								} else {
									tbody.style.transition = 'transform .2s ease-out'
									this.scroll = true
								}
							}, 100)
						}
					}
				}
			})

			observer.observe(document, { childList: true, subtree: true })
		}
	}

	create () {
		const { height } = this.state
		const { table } = this.tableInstance
		const scroller = table.querySelector('.it-tbody-group')
		const tbody = scroller.querySelector('.it-tbody')

		scroller.style.height = `${height}px`
		tbody.style.position = 'absolute'
		tbody.style.overflow = 'hidden'

		this.created = true
		this.scroll = true
	}

	bindEvent () {
		this.start = 0
		this.distance = 0
		this.current = 0

		if (this.state.wheel) {
			this.bindWheelEvent()
		}
		
		if (this.state.mouse) {
			this.bindMoveEvent()
		}
	}

	afterRenderBody () {
		const { table } = this.tableInstance
		const { height } = this.state
		const scroller = table.querySelector('.it-tbody-group')
		const tbody = scroller.querySelector('.it-tbody')
		const tbodyHeight = tbody.getBoundingClientRect().height
	
		if (tbodyHeight < height) {
			tbody.style.transition = ''
			scroller.style.height = `${tbodyHeight}px`
			tbody.style.transform = 'translateY(0)'
			this.scroll = false
			this.start = 0
			this.distance = 0
			this.current = 0
		} else {
			tbody.style.transition = 'transform .2s ease-out'
			scroller.style.height = `${height}px`
			this.scroll = true
		}
	}

	bindMoveEvent () {
		const { table } = this.tableInstance
		const scroller = table.querySelector('.it-tbody-group')
		const tbody = scroller.querySelector('.it-tbody')

		const MoveScroller = ev => {
			const evt = ev || event

			this.distance = evt.clientY - this.start

			if (!this.state.scrolling && Math.abs(this.distance) >= 10) {
				this.state.scrolling = true
			}

			tbody.style.transform = `translateY(${this.current + this.distance}px)`
			return false
		}

		const finishMoving = () => {
			this.current += this.distance
			this.positionCorrect()

			tbody.style.userSelect = ''
			tbody.style.transition = 'none'

			if (this.state.scrolling) {
				setTimeout(() => {
					this.state.scrolling = false
				}, 200)
			}

			document.removeEventListener('mousemove', MoveScroller)
			document.removeEventListener('mouseup', finishMoving)
		}

		table.addEventListener('mousedown', ev => {
			// console.log(this.scroll);
			if (this.scroll === false) {
				return false
			}
			const evt = ev || event

			const path = evt.path
			let target = null
			if (path) {
				target = path.find(value => value.classList && value.classList.contains('it-tbody'))
			} else {
				target = evt.target || evt.srcElement
				target = checkPathByClass(target, 'it-tbody')
			}

			if (target) {
				this.start = evt.clientY
				tbody.style.userSelect = 'none'
				tbody.style.transition = 'none'

				document.addEventListener('mousemove', MoveScroller)
				document.addEventListener('mouseup', finishMoving)
			}
		})
	}

	bindWheelEvent () {
		const { table } = this.tableInstance
		const scroller = table.querySelector('.it-tbody-group')
		const tbody = scroller.querySelector('.it-tbody')

		scroller.addEventListener('wheel', ev => {
			if (this.scroll === false) {
				return false
			}

			const evt = ev || event
			const { wheelDeltaY } = evt
			const { wheelDistance } = this.state
			const direction = wheelDeltaY / Math.abs(wheelDeltaY) + 1

			if (direction) {
				// 向上滚动
				this.current += wheelDistance
			} else {
				// 向下滚动
				this.current -= wheelDistance
			}

			tbody.style.transform = `translateY(${this.current}px)`
			this.positionCorrect()
		})
	}

	positionCorrect () {
		const { table } = this.tableInstance
		const { height } = this.state
		const tbody = table.querySelector('.it-tbody');
		const tbodyRect = tbody.getBoundingClientRect()
		const bottom = -(tbodyRect.height - height)

		if (this.current > 0) {
			tbody.style.transform = 'translateY(0)'
			this.current = 0
		} else if (this.current < bottom) {
			tbody.style.transform = `translateY(${bottom}px)`
			this.current = bottom
		}
	}
}
