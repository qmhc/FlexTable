/**
 *	@name layer
 *	@description 表格提示遮罩层
 */

import { temp } from 'core/temps'
import { getType } from '@/utils'

import './style.scss'

export default class Layer {
	constructor (tableInstance, options) {
		this.tableInstance = tableInstance

		const { state } = this.tableInstance

		const layerable = getType(options.layer) === 'object'

		if (layerable) {
			const { loading, notFound, delay, loadingText, notFoundText } = options.layer

			state.layer = {
				layerable,
				loading: loading === true,
				notFound: notFound !== false,
				delay: delay || 500,
				loadingText: loadingText || 'Loading...',
				notFoundText: notFoundText || 'Not Found'
			}
		} else {
			state.layer = {
				layerable
			}
		}

		this.state = state.layer
	}

	afterContruct () {
		this.globalState = this.tableInstance.state
	}

	shouldUse () {
		return this.state.layerable
	}

	// beforeRenderBody () {
	// 	if (this.created && this.notFound) {
	// 		this.toggleNotFound(false)
	// 	}
	// }

	beforeRenderData () {
		if (this.created && this.state.loading) {
			if (!this.loading) {
				this.toggleLoading(true)
			}
		}
	}

	create () {
		const { table } = this.tableInstance
		const tbodyGroup = table.querySelector('.it-tbody-group')
		const loadingLayer = temp.cloneNode()
		loadingLayer.className = 'it-layer'

		const loading = temp.cloneNode()
		loading.className = 'it-message'
		loading.textContent = this.state.loadingText

		loadingLayer.appendChild(loading)
		tbodyGroup.appendChild(loadingLayer)
		this.loadingLayer = loadingLayer
		this.loading = false

		const notFoundLayer = loadingLayer.cloneNode()

		const notFound = loading.cloneNode()
		notFound.textContent = this.state.notFoundText

		notFoundLayer.appendChild(notFound)
		// prependChild(tbodyGroup, notFoundLayer)
		tbodyGroup.appendChild(notFoundLayer)
		this.notFoundLayer = notFoundLayer
		this.notFound = false

		this.tableInstance.registerMethod('displayLoading', this.toggleLoading.bind(this, true), false)
		this.tableInstance.registerMethod('hiddenLoading', this.toggleLoading.bind(this, false), false)
		this.tableInstance.registerMethod('displayNotFound', this.toggleNotFound.bind(this, true), false)
		this.tableInstance.registerMethod('hiddenNotFound', this.toggleNotFound.bind(this, false), false)

		this.created = true
	}

	afterRenderData (data) {
		if (this.created) {
			const { loading, notFound, delay } = this.state

			if (notFound) {
				if (this.notFound && data.length) {
					this.toggleNotFound(false)
				} else if (!this.notFound && !data.length) {
					this.toggleNotFound(true)
				}
			}
			
			if (loading) {
				if (this.loading) {
					setTimeout(() => {
						this.toggleLoading(false)
					}, delay)
				}
			}
		}
	}

	toggleLoading (type = true) {
		if (typeof type !== 'boolean') {
			return false
		}

		if (type) {
			this.loadingLayer.classList.add('visible')
			this.loading = true
		} else {
			this.loading = false
			this.loadingLayer.classList.remove('visible')
		}
	}

	toggleNotFound (type = true) {
		// const tbody = table[this.target].target.querySelector('.it-tbody');
		if (typeof type !== 'boolean') {
			return false
		}

		if (type) {
			// tbody.appendChild(this.notFoundLayer);
			this.notFoundLayer.classList.add('visible')
			this.notFound = true
		} else {
			this.notFoundLayer.classList.remove('visible')
			
			setTimeout(() => {
				this.notFound = false
				// tbody.removeChild(this.notFoundLayer);
			}, 500)
		}
	}
}
