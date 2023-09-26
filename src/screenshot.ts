import {$} from './core';
import {loadConfig} from './saves/config';

export function isScreenshotWorker(): boolean {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.has('screenshot-worker');
}

export function initScreenshotWorker() {
	$('settingsBox').classList.add('hidden');
	$('zoom').classList.add('hidden');
	$('fpsCounter').parentElement.classList.add('hidden');

	window['prepareScreenshot'] = (data: string) => {
		loadConfig(JSON.parse(data));
	};
}
