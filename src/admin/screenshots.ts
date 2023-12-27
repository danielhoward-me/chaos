import {ScreenshotStatus} from './../constants';
import {getScreenshotStatus, requestScreenshot as backendRequestScreenshot} from './../lib/backend';
import {readFile} from './../lib/files';
import {$, buttonLoading} from './index';

const screenshotStatusForm = $<HTMLFormElement>('screenshotStatusForm');
const screenshotStatusInput = $<HTMLInputElement>('screenshotStatusInput');
const screenshotStatusButton = $<HTMLButtonElement>('screenshotStatusButton');
const screenshotStatusError = $('screenshotStatusError');

const screenshotStatusContainer = $('screenshotStatusContainer');
const screenshotStatusFailed = $('screenshotStatusFailed');
const statusIndicators = Array.from(screenshotStatusContainer.children) as HTMLElement[];

const generateScreenshotButton = $<HTMLButtonElement>('generateScreenshotButton');
const generateScreenshotUpload = $<HTMLInputElement>('generateScreenshotUpload');
const generateScreenshotError = $('generateScreenshotError');
const generateScreenshotHash = $('generateScreenshotHash');

async function onScreenshotStatusSubmit(ev: Event) {
	ev.preventDefault();

	screenshotStatusError.textContent = '';
	buttonLoading(true, screenshotStatusButton);

	const hash = screenshotStatusInput.value;

	try {
		const {status} = await getScreenshotStatus(hash);

		resetStatus();
		setScreenshotStatus(status);
	} catch (err) {
		console.error(err);
		screenshotStatusError.textContent = 'There was an error when fetching the status of your screenshot';
	}

	buttonLoading(false, screenshotStatusButton);
}

function setScreenshotStatus(status: ScreenshotStatus) {
	if (status === ScreenshotStatus.Failed) {
		screenshotStatusFailed.classList.add('current-status');
		screenshotStatusFailed.classList.add('current-status-active');
		return;
	}

	if (status == ScreenshotStatus.NotInQueue) makeIndicatorActive(statusIndicators.slice(0, 1));
	if (status == ScreenshotStatus.InQueue) makeIndicatorActive(statusIndicators.slice(0, 3));
	if (status == ScreenshotStatus.Generating) makeIndicatorActive(statusIndicators.slice(0, 5));
	if (status == ScreenshotStatus.Generated) makeIndicatorActive(statusIndicators);
}

function makeIndicatorActive(elements: HTMLElement[]) {
	elements.forEach((el, i) => {
		el.classList.add('current-status');

		if (i === elements.length - 1) {
			el.classList.add('current-status-active');
		}
	});
}

function resetStatus() {
	([...statusIndicators, screenshotStatusFailed]).forEach((el) => {
		el.classList.remove('current-status');
		el.classList.remove('current-status-active');
	});
}

async function onRequestScreenshotUpload() {
	buttonLoading(true, generateScreenshotButton);
	generateScreenshotHash.textContent = '';
	generateScreenshotError.textContent = '';

	try {
		const {content} = await readFile(generateScreenshotUpload);

		const hash = await requestScreenshot(content);

		generateScreenshotHash.textContent = `Hash: ${hash}`;
	} catch (err) {
		console.error(err);
		generateScreenshotError.textContent = 'There was an error when trying to take a new screenshot';

		buttonLoading(false, generateScreenshotButton);
		return;
	}

	buttonLoading(false, generateScreenshotButton);
}

async function requestScreenshot(saveData: string): Promise<string> {
	const {hash} = await backendRequestScreenshot(saveData, true);
	return hash;
}

export function onload() {
	screenshotStatusForm.addEventListener('submit', onScreenshotStatusSubmit);
	generateScreenshotButton.addEventListener('click', () => generateScreenshotUpload.click());
	generateScreenshotUpload.addEventListener('change', onRequestScreenshotUpload);
}
