import {topLeftPoint, scale, handleZoom} from './canvas/canvas';
import {MINIMUM_SCREEN_WIDTH_FOR_MOBILE} from './constants';
import TagInput from './tag-input';

import type {InputElement, Keybinds} from './types.d';

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
	return <T> document.getElementById(id);
}

// Used with classes like hidden to make hiding/showing element easier
export function makeClassToggler(
	element: HTMLElement,
	className: string,
	invert?: boolean,
	callback?: (enabled: boolean) => void,
): (force?: boolean) => boolean {
	return (force?: boolean) => {
		let enabled = element.classList.toggle(className, invert ? (force === undefined ? undefined : !force) : force);
		if (invert) enabled = !enabled;
		if (callback) callback(enabled);
		return enabled;
	};
}

export const canvas = $<HTMLCanvasElement>('canvas');

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

export function screenIsInMobileMode(): boolean {
	return canvas.width <= MINIMUM_SCREEN_WIDTH_FOR_MOBILE;
}

function getCurrentScreenCenter() {
	const center = [canvas.width/2, canvas.height/2];

	if (settingsBox.classList.contains('closed')) {
		return center;
	}

	if (screenIsInMobileMode()) {
		center[1] /= 2;
	} else {
		center[0] += 215;
	}

	return center;
}
function zoomIn() {
	handleZoom(getCurrentScreenCenter(), -100);
}
function zoomOut() {
	handleZoom(getCurrentScreenCenter(), 100);
}

const settingsBox = $('settingsBox');

const toggleSettingsBox = makeClassToggler(settingsBox, 'closed', true, (isOpen) => {
	const multiplier = isOpen ? -1 : 1;
	// Shift the graph my half the size of the settings box
	if (screenIsInMobileMode()) {
		topLeftPoint[1] += (canvas.height/4 * multiplier) * scale;
	} else {
		topLeftPoint[0] += (215 * multiplier) * scale;
	}
});

// Allows a general function to be called to not worry about element type and make sure the correct events are triggered
export function setInputValue(input: HTMLInputElement | HTMLSelectElement, value: string | number | boolean, triggerEvent?: boolean): void
export function setInputValue(input: TagInput, value: string[], triggerEvent?: boolean): void
export function setInputValue(input: InputElement, value: string | number | boolean | string[], triggerEvent?: boolean): void
export function setInputValue(input: InputElement, value: string | number | boolean | string[], triggerEvent?: boolean): void {
	const newValue = Number.isFinite(value) ? value.toString() : value as string | boolean | string[];

	let eventName: string;

	if (input instanceof HTMLInputElement) {
		switch (input.type) {
		case 'checkbox':
			input.checked = <boolean> newValue;
			break;
		default:
			input.value = <string> newValue;
		}

		eventName = 'input';
	} else if (input instanceof HTMLSelectElement) {
		input.value = <string> newValue;
		eventName = 'change';
	} else if (input instanceof TagInput) {
		input.value = <string[]> newValue;
		eventName = 'tagschanged';
	}

	if (triggerEvent) input.dispatchEvent(new Event(eventName));
}

// Allows a general function to be called to not worry about element type
export function getInputValue(input: HTMLInputElement | HTMLSelectElement): string | boolean
export function getInputValue(input: TagInput): string[]
export function getInputValue(input: InputElement): string | boolean | string[]
export function getInputValue(input: InputElement): string | boolean | string[] {
	if (input instanceof HTMLInputElement && input.type === 'checkbox') {
		return input.checked;
	} else {
		return input.value;
	}
}

// Allows us to complete operations on all items in a NodeList
export function setNodeListValue(list: NodeList, key: string, value: string) {
	list.forEach((node) => {
		node[key] = value;
	});
}

const helpBox = $('helpBox');

const toggleHelpBox = makeClassToggler(helpBox, 'closed', true, (isOpen) => {
	const newHash = isOpen ? (window.location.hash.startsWith('#help') ? window.location.hash : '#help') : '';
	if (newHash !== window.location.hash) {
		window.history.pushState(null, null, window.location.pathname + newHash);
	}
});

function readHelpHash() {
	const hash = window.location.hash;
	const isHelpHash = hash.startsWith('#help');
	toggleHelpBox(isHelpHash);
	if (!isHelpHash) return;

	const helpSection = hash.split('#')[1];
	const sectionElement = document.querySelector(`[data-help-section="${helpSection}"]`);
	if (sectionElement) {
		sectionElement.scrollIntoView({behavior: 'smooth'});
	}
}

export function executeKeybind(keybinds: Keybinds, event: KeyboardEvent) {
	if (event.target instanceof HTMLInputElement && event.target.tagName === 'INPUT') return;

	const keybindFunction = keybinds[event.code];
	if (!keybindFunction) return;

	keybindFunction();
}

const keybinds: Keybinds = {
	'KeyS': toggleSettingsBox,
	'KeyH': toggleHelpBox,
	'Equal': zoomIn,
	'Minus': zoomOut,
	'Escape': () => {
		if (!helpBox.classList.contains('closed')) {
			toggleHelpBox();
		} else if (!settingsBox.classList.contains('closed')) {
			toggleSettingsBox();
		}
	},
};

export function onload() {
	window.addEventListener('resize', resizeCanvas);
	resizeCanvas();

	$('zoomInButton').addEventListener('click', zoomIn);
	$('zoomOutButton').addEventListener('click', zoomOut);

	$('openSettingsButton').addEventListener('click', () => toggleSettingsBox(true));
	$('closeSettingsButton').addEventListener('click', () => toggleSettingsBox(false));
	$('openHelpButton').addEventListener('click', () => toggleHelpBox(true));
	$('closeHelpButton').addEventListener('click', () => toggleHelpBox(false));

	// Keep range and respective number inputs consistent
	document.querySelectorAll('[data-input-range-pair]').forEach((container: HTMLDivElement) => {
		const numberInput = container.querySelector<HTMLInputElement>('input[type=number]');
		const rangeInput = container.querySelector<HTMLInputElement>('input[type=range]');

		if (!numberInput || !rangeInput) {
			console.error(`No ${numberInput ? 'range' : 'number'} input found in the following input range pair`, container);
			return;
		}

		numberInput.addEventListener('input', () => {
			rangeInput.value = numberInput.value;
		});
		rangeInput.addEventListener('input', () => {
			setInputValue(numberInput, rangeInput.value, true);
		});
	});

	readHelpHash();
	window.addEventListener('hashchange', readHelpHash);
	document.querySelectorAll('a[href^="#help-"]').forEach((element) => {
		element.addEventListener('click', readHelpHash);
	});

	window.addEventListener('keydown', (e) => executeKeybind(keybinds, e));
}
