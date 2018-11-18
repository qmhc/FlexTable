import { table, state } from './status';
import { sortByProps } from '@/utils';
import { renderBodyData } from './render';
import {
	temp,
} from './temps';

// 记录按键
let useCtrl = false;
let useShift = false;
let useAlt = false;

export function getKeyState(name) {
	switch (name) {
		case 'ctrl': return useCtrl;
		case 'shift': return useShift;
		case 'alt': return useAlt;
	}
}

document.addEventListener('keydown', function(ev) {
	const code = ev.keyCode;
	switch (code) {
		case 16: useShift = true; break;
		case 17: useCtrl = true; break;
		case 18: useAlt = true; break;
	}
});

document.addEventListener('keyup', function(ev) {
	const code = ev.keyCode;
	switch (code) {
		case 16: useShift = false; break;
		case 17: useCtrl = false; break;
		case 18: useAlt = false; break;
	}
});