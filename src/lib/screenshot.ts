import {ScreenshotStatus, SCREENSHOT_GENEREATION_CHECK_INTERVAL} from './../constants';
import {getScreenshotStatus, requestScreenshot} from './backend';

export function getGeneratingScreenshotElement(): HTMLDivElement {
	const container = document.createElement('div');
	container.classList.add('card-img-top');
	container.classList.add('missing-screenshot');

	const loadingContainer = document.createElement('div');
	loadingContainer.classList.add('text-muted');
	loadingContainer.id = 'loading';
	container.appendChild(loadingContainer);

	const spinner = document.createElement('div');
	spinner.classList.add('spinner-border');
	loadingContainer.appendChild(spinner);

	const loadingBr = document.createElement('br');
	loadingContainer.appendChild(loadingBr);

	const message = document.createElement('span');
	message.textContent = 'Generating Preview';
	loadingContainer.appendChild(message);

	const failedContainer = document.createElement('div');
	failedContainer.classList.add('hidden');
	failedContainer.id = 'failed';
	container.appendChild(failedContainer);

	const iconContainer = document.createElement('div');
	iconContainer.classList.add('icon-container');
	failedContainer.appendChild(iconContainer);

	const xIcon = document.createElement('i');
	xIcon.classList.add('bi');
	xIcon.classList.add('bi-x');
	iconContainer.appendChild(xIcon);

	const failedBr = document.createElement('br');
	failedContainer.appendChild(failedBr);

	const failedMessage = document.createElement('span');
	failedMessage.id = 'failedScreenshotError';
	failedContainer.appendChild(failedMessage);

	return container;
}

export function beginMissingScreenshotSequence(img: HTMLImageElement, placeHolder: HTMLDivElement, hash: string, data: string) {
	setTimeout(async () => {
		try {
			const {status} = await getScreenshotStatus(hash);

			switch (status) {
			case ScreenshotStatus.Generated:
				showMissingScreenshot(img, placeHolder);
				return;
			case ScreenshotStatus.Failed:
				placeHolder.querySelector('#failedScreenshotError').textContent = `We couldn't get a preview of your save. The config is most likely invalid.`;
				placeHolder.querySelector('#loading').classList.add('hidden');
				placeHolder.querySelector('#failed').classList.remove('hidden');
				return;
			case ScreenshotStatus.Generating:
			case ScreenshotStatus.InQueue:
				break;
			case ScreenshotStatus.NotInQueue:
				await requestScreenshot(data);
				break;
			}
		} catch (err) {
			console.error(err);
			placeHolder.querySelector('#failedScreenshotError').textContent = `There was an error when fetching the preview status. Please try again later.`;
			placeHolder.querySelector('#loading').classList.add('hidden');
			placeHolder.querySelector('#failed').classList.remove('hidden');
		}

		beginMissingScreenshotSequence(img, placeHolder, hash, data);
	}, SCREENSHOT_GENEREATION_CHECK_INTERVAL);
}

function showMissingScreenshot(img: HTMLImageElement, placeHolder: HTMLDivElement) {
	const src = `${img.src}?${Date.now()}`;

	const loaderImage = new Image();
	loaderImage.onload = function() {
		img.src = src;
		placeHolder.classList.add('hidden');
		img.classList.remove('hidden');
	};
	loaderImage.src = src;
}
