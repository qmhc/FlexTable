import { table, state } from 'core/status';

import './style.scss';

export default class {
	constructor(target) {
		this.target = target;
		// init core
	}
	shouldUse(state) {
		return true;
	}
	beforeInit(options) {}
	beforeRenderBody() {}
	beforeRenderData() {}
	beforeCreate() {}
	create() {
		// create code
		this.created = true;
	}
	bindEvent() {}
	afterCreate() {}
	afterRenderBody() {}
	afterRenderData() {}
};