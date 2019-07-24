/**
 *	@name scroller
 *	@description 表格滚动条
 */

import './style.scss'

export default class Scroller {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance

		const { bodyHeight, wheelDistance } = options

		if (typeof bodyHeight === 'number') {
			this.tableInstance.state = {
				...this.tableInstance.state,
				useScroller: true,
				bodyHeight: bodyHeight < 200? 200: bodyHeight,
				wheelDistance: wheelDistance || 20
			}
		}
	}

	afterContruct () {
		this.state = this.tableInstance.state
	}

	shouldUse() {
		return this.state.useScroller === true
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
							const { bodyHeight } = this.state
							const scroller = table.querySelector('.it-tbody-group')
							const tbody = scroller.querySelector('.it-tbody')

							setTimeout(() => {
								const tbodyHeight = tbody.getBoundingClientRect().height

								if (tbodyHeight < bodyHeight) {
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
		const { bodyHeight } = this.state
		const { table } = this.tableInstance
		const scroller = table.querySelector('.it-tbody-group')
		const tbody = scroller.querySelector('.it-tbody')

		scroller.style.height = `${bodyHeight}px`
		tbody.style.position = 'absolute'

		this.created = true
		this.scroll = true
	}

	bindEvent () {
		this.start = 0
		this.distance = 0
		this.current = 0

		this.bindWheelEvent()
		this.bindMoveEvent()
	}

	afterRenderBody () {
		const { table } = this.tableInstance
		const { bodyHeight } = this.state
		const scroller = table.querySelector('.it-tbody-group')
		const tbody = scroller.querySelector('.it-tbody')
		const tbodyHeight = tbody.getBoundingClientRect().height

		if (tbodyHeight < bodyHeight) {
			tbody.style.transition = ''
			scroller.style.height = `${tbodyHeight}px`
			tbody.style.transform = 'translateY(0)'
			this.scroll = false
			this.start = 0
			this.distance = 0
			this.current = 0
		} else {
			tbody.style.transition = 'transform .2s ease-out'
			scroller.style.height = `${bodyHeight}px`
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
			tbody.style.transform = `translateY(${this.current + this.distance}px)`
			return false
		}

		const finishMoving = () => {
			this.current += this.distance
			this.positionCorrect()

			tbody.style.userSelect = ''
			tbody.style.transition = 'none'

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
		const { bodyHeight } = this.state
		const tbody = table.querySelector('.it-tbody');
		const { height } = tbody.getBoundingClientRect()
		const bottom = -(height - bodyHeight)

		if (this.current > 0) {
			tbody.style.transform = 'translateY(0)'
			this.current = 0
		} else if (this.current < bottom) {
			tbody.style.transform = `translateY(${bottom}px)`
			this.current = bottom
		}
	}
}
