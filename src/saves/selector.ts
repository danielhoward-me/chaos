import {SCREENSHOT_GENEREATION_CHECK_INTERVAL, ScreenshotStatus} from './../constants';
import {$, makeClassToggler} from './../core';
import {getScreenshotStatus, requestScreenshot} from './backend';
import {loadConfig} from './config';
import {backendOrigin} from './paths';

import type {Save, SaveConfig} from './../types.d';

export enum SaveType {
	Preset = 'preset',
	Local = 'local',
	Cloud = 'cloud',
}

let currentType: SaveType | null = null;
const saveCache: Record<SaveType, {
	deleteFunc: ((save: Save) => void) | null;
	saves: Save[];
} | null> = {
	[SaveType.Preset]: null,
	[SaveType.Local]: null,
	[SaveType.Cloud]: null,
};

const savesButtons: Record<SaveType, HTMLElement> = {
	[SaveType.Preset]: $('presetSavesButton'),
	[SaveType.Local]: $('localSavesButton'),
	[SaveType.Cloud]: $('cloudSavesButton'),
};
const savesContainers = {
	[SaveType.Preset]: $('presetSaves'),
	[SaveType.Local]: $('localSaves'),
	[SaveType.Cloud]: $('cloudSaves'),
};
const savesContainersTogglers = Object.entries(savesContainers).reduce<Record<string, (force: boolean) => void>>(
	(acc, [type, container]) => {
		acc[type] = makeClassToggler(container, 'hidden', true, (enabled) => {
			savesButtons[type].classList.toggle('btn-outline-primary', !enabled);
			savesButtons[type].classList.toggle('btn-primary', enabled);
		});
		return acc;
	}, {},
);

function hideAllContainers() {
	Object.values(savesContainersTogglers).forEach((toggler) => toggler(false));
}

function setContainerActive(type: SaveType | null) {
	currentType = currentType == type ? null : type;

	hideAllContainers();
	if (!currentType) return;

	savesContainersTogglers[type](true);
}

export function populateSavesSection(type: SaveType, saves: null): void
export function populateSavesSection(type: SaveType, saves: Save[], deleteSave: ((save: Save) => void) | null): void
export function populateSavesSection(type: SaveType, saves: Save[] | null, deleteSave?: ((save: Save) => void) | null) {
	saveCache[type] = {
		saves,
		deleteFunc: deleteSave,
	};

	const container = savesContainers[type].querySelector('.saves-container');
	container.innerHTML = '';

	if (saves === null) return;
	if (saves.length === 0) {
		const text = document.createElement('span');
		text.classList.add('text-muted');
		text.textContent = `You don't currently have any ${type} saves`;
		container.appendChild(text);
	} else {
		saves.forEach((save) => {
			const card = createSaveCard(save, deleteSave, type, saves);
			container.appendChild(card);
		});
	}
}

function createSaveCard(save: Save, deleteSaveFunc: ((save: Save) => void) | null, type: SaveType, saves: Save[]): HTMLDivElement {
	const card = document.createElement('div');
	card.classList.add('card');
	card.classList.add('save-card');

	const img = document.createElement('img');
	img.classList.add('card-img-top');
	img.alt = `${save.name} screenshot`;
	img.src = `${backendOrigin}/screenshot/${save.screenshot}.jpg`;
	img.addEventListener('error', () => {
		img.classList.add('hidden');
		const placeHolder = getGeneratingImageElement();
		card.prepend(placeHolder);
		beginMissingScreenshotSequence(img, placeHolder, save.screenshot, save.data);
	});
	card.appendChild(img);

	const body = document.createElement('div');
	body.classList.add('card-body');
	card.appendChild(body);

	const title = document.createElement('h5');
	title.classList.add('card-title');
	title.textContent = save.name;
	body.appendChild(title);

	const errorText = document.createElement('div');
	errorText.classList.add('error-text');
	errorText.classList.add('hidden');
	body.appendChild(errorText);

	const footer = document.createElement('div');
	footer.classList.add('card-footer');
	card.appendChild(footer);

	const buttonContainer = document.createElement('div');
	buttonContainer.classList.add('button-container');
	footer.appendChild(buttonContainer);

	const useButton = document.createElement('button');
	useButton.classList.add('btn');
	useButton.classList.add('btn-primary');
	useButton.classList.add('load-button');
	useButton.textContent = 'Load';
	useButton.addEventListener('click', () => useSave(save, errorText));
	buttonContainer.appendChild(useButton);

	if (deleteSaveFunc !== null) {
		const deleteButton = document.createElement('button');
		deleteButton.classList.add('btn');
		deleteButton.classList.add('btn-danger');
		deleteButton.classList.add('delete-button');
		deleteButton.addEventListener('click', () => deleteSave(deleteSaveFunc, save, deleteButton, errorText, type, saves));
		buttonContainer.appendChild(deleteButton);

		const deleteIcon = document.createElement('i');
		deleteIcon.classList.add('bi');
		deleteIcon.classList.add('bi-trash');
		deleteButton.appendChild(deleteIcon);
	}

	return card;
}

async function useSave(save: Save, errorText: HTMLDivElement) {
	errorText.classList.add('hidden');

	try {
		const config = JSON.parse(save.data) as SaveConfig;
		await loadConfig(config);

		setContainerActive(null);
	} catch (err) {
		console.error(err);
		errorText.textContent = 'There was an error when trying to load your save';
		errorText.classList.remove('hidden');
	}
}

async function deleteSave(deleteSaveFunc: (save: Save) => void | Promise<void>, save: Save, deleteButton: HTMLButtonElement, errorText: HTMLDivElement, type: SaveType, saves: Save[]) {
	errorText.classList.add('hidden');

	const spinner = document.createElement('span');
	spinner.classList.add('spinner-border');
	spinner.classList.add('spinner-border-sm');
	spinner.style.marginRight = '4px';

	deleteButton.prepend(spinner);
	deleteButton.disabled = true;

	try {
		await deleteSaveFunc(save);
	} catch (err) {
		console.error(err);
		errorText.textContent = 'There was an error when trying to delete your save';
		errorText.classList.remove('hidden');

		deleteButton.removeChild(spinner);
		deleteButton.disabled = false;
		return;
	}

	populateSavesSection(type, saves.filter(({id}) => save.id !== id), deleteSaveFunc);
}

function getGeneratingImageElement(): HTMLDivElement {
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

function beginMissingScreenshotSequence(img: HTMLImageElement, placeHolder: HTMLDivElement, hash: string, data: string) {
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

export function addSaveToSection(type: SaveType, save: Save) {
	const saveSectionData = saveCache[type];
	if (saveSectionData === null) throw new Error(`${type} section has not been populated`);

	saveSectionData.saves.push(save);
	populateSavesSection(type, saveSectionData.saves, saveSectionData.deleteFunc);
}

export function onload() {
	Object.entries(savesButtons).forEach(([type, button]) => {
		button.addEventListener('click', () => {
			setContainerActive(type as SaveType);
		});
	});
}
