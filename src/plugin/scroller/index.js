/**
 *	@name scroller
 *	@description 表格滚动条
 */

import { table, state } from 'core/status';
import { temp } from 'core/temps';

import './style.scss';

export default class {
	constructor(target) {
		this.target = target;
	}
	shouldUse(state) {
		return state.useScroller === true;
	}
	beforeInit(options) {
		const target = this.target;
		const { bodyHeight } = options;
		if (typeof bodyHeight === 'number') {
			state[target] = {
				...state[target],
				useScroller: true,
				bodyHeight: bodyHeight < 200? 200: bodyHeight,
			}
		}
	}
	beforeCreate() {
		const target = this.target;
		const { target: iTable } = table[target];
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
						const addedNodes = [...mutation.addedNodes];
						if (addedNodes.includes(iTable)) {
							const { bodyHeight } = state[target];
							const scroller = iTable.querySelector('.it-tbody-group');
							const tbody = scroller.querySelector('.it-tbody');
							// 
							setTimeout(() => {
								const tbodyHeight = tbody.getBoundingClientRect().height;
								// console.log({tbodyHeight});
								if (tbodyHeight < bodyHeight) {
									tbody.style.transition = '';
									scroller.style.height = `${tbodyHeight}px`;
									tbody.style.transform = 'translateY(0)';
									this.scroll = false;
									this.start = 0;
									this.distance = 0;
									this.current = 0;
								} else {
									tbody.style.transition = 'transform .2s ease-out';
									this.scroll = true;
								}
							}, 300);
						}
					}
				}
			});
			observer.observe(document, { childList: true, subtree: true });
		}
	}
	create() {
		const target = this.target;
		const { bodyHeight } = state[target];
		const { target: iTable } = table[target];
		const scroller = iTable.querySelector('.it-tbody-group');
		const tbody = scroller.querySelector('.it-tbody');

		scroller.style.height = `${bodyHeight}px`;
		tbody.style.position = 'absolute';

		this.created = true;
		this.scroll = true;
	}
	bindEvent() {
		this.start = 0;
		this.distance = 0;
		this.current = 0;

		this.bindWheelEvent();
		this.bindMoveEvent();		
	}
	afterRenderBody() {
		const target = this.target;
		const { target: iTable } = table[target];
		const { bodyHeight } = state[target];
		const scroller = iTable.querySelector('.it-tbody-group');
		const tbody = scroller.querySelector('.it-tbody');
		const tbodyHeight = tbody.getBoundingClientRect().height;
		if (tbodyHeight < bodyHeight) {
			tbody.style.transition = '';
			scroller.style.height = `${tbodyHeight}px`;
			tbody.style.transform = 'translateY(0)';
			this.scroll = false;
			this.start = 0;
			this.distance = 0;
			this.current = 0;
		} else {
			tbody.style.transition = 'transform .2s ease-out';
			scroller.style.height = `${bodyHeight}px`;
			this.scroll = true;
		}
	}
	bindMoveEvent() {
		const { target: iTable } = table[this.target];
		const { bodyHeight } = state[this.target];
		const scroller = iTable.querySelector('.it-tbody-group');
		const tbody = scroller.querySelector('.it-tbody');

		const MoveScroller = ev => {
			const evt = ev || event;
			this.distance = evt.clientY - this.start;
			tbody.style.transform = `translateY(${this.current + this.distance}px)`;
			return false;
		}

		const finishMoving = () => {
			const { height } = tbody.getBoundingClientRect();
			const bottom = -(height - bodyHeight);
			this.current += this.distance;
			this.positionCorrect();
			tbody.style.userSelect = '';
			document.removeEventListener('mousemove', MoveScroller);
			document.removeEventListener('mouseup', finishMoving);
		}

		iTable.addEventListener('mousedown', ev => {
			// console.log(this.scroll);
			if (this.scroll === false) return;
			const evt = ev || event;

			const path = evt.path;
			let target = null;
			if (path) {
				target = path.find(value => value.classList && value.classList.contains('it-tbody'));
			} else {
				target = evt.target || evt.srcElement;
				target = checkPathByClass(target, 'it-sort');
			}

			if (target) {
				this.start = evt.clientY;
				target.style.userSelect = 'none';

				document.addEventListener('mousemove', MoveScroller);
				document.addEventListener('mouseup', finishMoving);
			}
		});
	}
	bindWheelEvent() {
		const { target: iTable } = table[this.target];
		const { bodyHeight } = state[this.target];
		const scroller = iTable.querySelector('.it-tbody-group');
		const tbody = scroller.querySelector('.it-tbody');	

		scroller.addEventListener('wheel', ev => {
			if (this.scroll === false) return;
			const evt = ev || event;
			const { wheelDeltaY } = evt;
			const direction = wheelDeltaY / Math.abs(wheelDeltaY) + 1;

			if (direction) {
				// 向上滚动
				this.current += 20;
			} else {
				// 向下滚动
				this.current -= 20;
			}

			tbody.style.transform = `translateY(${this.current}px)`;
			this.positionCorrect();			
		});
	}
	positionCorrect() {
		const { target: iTable } = table[this.target];
		const { bodyHeight } = state[this.target];
		const tbody = iTable.querySelector('.it-tbody');	
		const { height } = tbody.getBoundingClientRect();
			const bottom = -(height - bodyHeight);
		if (this.current > 0) {
			tbody.style.transform = 'translateY(0)';
			this.current = 0;
		} else if (this.current < bottom) {
			tbody.style.transform = `translateY(${bottom}px)`;
			this.current = bottom;
		}
	}
};