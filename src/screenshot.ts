import {scale, setScale, topLeftPoint, waitForFrameRender} from './canvas/canvas';
import {getBoundPoints} from './canvas/random-point';
import {SCREENSHOT_BORDER, SCREENSHOT_MAX_RATIO, SCREENSHOT_MIN_RATIO} from './constants';
import {$, canvas} from './core';
import {loadConfig} from './saves/config';
import {getChaosPoints, onSeek} from './setup/playback';
import {getShapeVertices} from './setup/shape-settings';

export function isScreenshotWorker(): boolean {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.has('screenshot-worker');
}

async function prepareScreenshot(data: string) {
	await loadConfig(JSON.parse(data));

	canvas.style.width = 'unset';
	canvas.style.height = 'unset';
	canvas.width -= 2 * SCREENSHOT_BORDER;
	canvas.height -= 2 * SCREENSHOT_BORDER;

	const points = [
		...getShapeVertices(),
		...getChaosPoints().map((point) => point.point),
	];
	const {max: topRight, min: bottomLeft} = getBoundPoints(points);

	let width = topRight[0] - bottomLeft[0];
	let height = topRight[1] - bottomLeft[1];

	const screenRatio = canvas.width/canvas.height;
	let ratio = width/height;
	console.log(ratio);

	if (ratio < SCREENSHOT_MIN_RATIO) {
		const expectedWidth = height * SCREENSHOT_MIN_RATIO;
		const widthRequied = (expectedWidth - width) / 2;
		bottomLeft[0] -= widthRequied;
		topRight[0] += widthRequied;
		width = expectedWidth;
	} else if (ratio > SCREENSHOT_MAX_RATIO) {
		const expectedHeight = width / SCREENSHOT_MAX_RATIO;
		const heightRequired = (expectedHeight - height) / 2;
		bottomLeft[1] -= heightRequired;
		topRight[1] += heightRequired;
		height = expectedHeight;
	}
	ratio = width/height;

	topLeftPoint[0] = bottomLeft[0];
	topLeftPoint[1] = topRight[1];
	if (ratio <= screenRatio) {
		setScale(height / (canvas.height/scale));
		canvas.width = width / scale;
	} else {
		setScale(width / (canvas.width/scale));
		canvas.height = height / scale;
	}

	canvas.width += 2 * SCREENSHOT_BORDER;
	canvas.height += 2 * SCREENSHOT_BORDER;

	topLeftPoint[0] -= SCREENSHOT_BORDER*scale;
	topLeftPoint[1] += SCREENSHOT_BORDER*scale;

	onSeek(100);
	await waitForFrameRender();
}

export function initScreenshotWorker() {
	$('settingsBox').classList.add('hidden');
	$('zoom').classList.add('hidden');
	$('fpsCounter').parentElement.classList.add('hidden');

	window['prepareScreenshot'] = prepareScreenshot;
}
