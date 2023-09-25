import {loadConfig} from './saves/config';
import {onSeek} from './setup/playback';

export function initScreenshotWorker() {
	window['prepareScreenshot'] = (data: string) => {
		loadConfig(JSON.parse(data));
		onSeek(100);
	};
}
