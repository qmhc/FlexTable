/**
 *	@name layer
 *	@description 表格提示遮罩层
 */

import { table, state } from 'core/status';
import { temp } from 'core/temps';
import { prependChild } from '@/utils';

import './style.scss';

export default class {
	constructor(target) {
		this.target = target;
	}
	shouldUse(state) {
		return state.useLayer;
	}
	beforeInit(options) {
		state[this.target].useLayer = options.useLayer === true;
	}
	beforeRenderBody() {
		if (this.created && this.notFound) {
			this.toggleNotFound(false);
		}
	}
	beforeRenderData() {
		if (this.created && this.notFound) {
			this.toggleNotFound(false);
		}
	}
	create() {
		const target = this.target;
		const { target: iTable } = table[target];
		const tbodyGroup = iTable.querySelector('.it-tbody-group');
		const loadingLayer = temp.cloneNode();
		loadingLayer.className = 'it-layer';

		const loading = temp.cloneNode();
		loading.className = 'it-message';
		loading.textContent = 'Loading...';

		loadingLayer.appendChild(loading);
		// iTable.appendChild(loadingLayer);
		// this.loadingLayer = loadingLayer;
		// this.loading = false;

		const notFoundLayer = loadingLayer.cloneNode();

		const notFound = loading.cloneNode();
		notFound.textContent = 'Not Found';

		notFoundLayer.appendChild(notFound);
		// prependChild(tbodyGroup, notFoundLayer);
		tbodyGroup.appendChild(notFoundLayer);
		this.notFoundLayer = notFoundLayer;
		this.notFound = false;

		this.created = true;
	}
	afterRenderData(data) {
		if (this.created) {
			if (!data.length) {
				this.toggleNotFound(true);
			}
		}
	}
	toggleLoading(type = true) {
		if (typeof type !== 'boolean') return;
		if (type) {
			this.loadingLayer.classList.add('visible');
			this.loading = true;
		} else {
			this.loading = false;
			this.loadingLayer.classList.remove('visible');
		}
	}
	toggleNotFound(type = true) {
		// const tbody = table[this.target].target.querySelector('.it-tbody');
		if (typeof type !== 'boolean') return;
		if (type) {
			// tbody.appendChild(this.notFoundLayer);
			this.notFoundLayer.classList.add('visible');
			this.notFound = true;
		} else {
			this.notFoundLayer.classList.remove('visible');
			setTimeout(() => {
				this.notFound = false;
				// tbody.removeChild(this.notFoundLayer);
			}, 300);
		}
	}
};