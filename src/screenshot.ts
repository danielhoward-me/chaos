import {toggleSettingsBox} from './core';
import {loadConfig} from './saves/config';

export function isScreenshotWorker(): boolean {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.has('screenshot-worker');
}

export function initScreenshotWorker() {
	window['prepareScreenshot'] = (data: string) => {
		toggleSettingsBox(false);
		loadConfig(JSON.parse(data));
	};
}
