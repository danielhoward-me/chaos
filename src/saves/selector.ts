import {$, makeClassToggler} from './../core';
import {loadConfig} from './config';
import {backendOrigin} from './paths';

import type {Save, SaveConfig} from './../types.d';

export enum SaveType {
	Preset = 'preset',
	Local = 'local',
	Cloud = 'cloud',
}

let currentType: SaveType | null = null;

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
export function populateSavesSection(type: SaveType, saves: Save[], deleteSave: (save: Save) => void): void
export function populateSavesSection(type: SaveType, saves: Save[] | null, deleteSave?: (save: Save) => void) {
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

function createSaveCard(save: Save, deleteSaveFunc: (save: Save) => void, type: SaveType, saves: Save[]): HTMLDivElement {
	const card = document.createElement('div');
	card.classList.add('card');
	card.classList.add('save-card');

	const img = document.createElement('img');
	img.classList.add('card-img-top');
	img.alt = `${save.name} screenshot`;
	img.src = save.screenshot ? `${backendOrigin}/screenshot/${save.screenshot}.jpg` : `/static/img/save-placeholder.jpg`;
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

	return card;
}

function useSave(save: Save, errorText: HTMLDivElement) {
	errorText.classList.add('hidden');

	try {
		const config = JSON.parse(save.data) as SaveConfig;
		loadConfig(config);

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

export function onload() {
	Object.entries(savesButtons).forEach(([type, button]) => {
		button.addEventListener('click', () => {
			setContainerActive(type as SaveType);
		});
	});
}
