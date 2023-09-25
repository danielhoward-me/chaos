import {$, makeClassToggler} from './../core';
import {getCurrentConfig} from './config';
import {SaveType, populateSavesSection} from './selector';

import type {Save} from './../types.d';

const localSaveFileInput = $<HTMLInputElement>('localSaveFileInput');
const uploadLocalSaveButton = $('uploadLocalSaveButton');
const localSaveError = $('localSaveError');

const showLocalSaveError = makeClassToggler(localSaveError, 'hidden', true);

function getLocalSaves(): Save[] {
	const data = localStorage.getItem('saves');

	if (data === null) {
		setLocalSaves([]);
		return getLocalSaves();
	}

	return JSON.parse(data);
}
function setLocalSaves(saves: Save[]) {
	localStorage.setItem('saves', JSON.stringify(saves));
}

function deleteLocalSave(save: Save) {
	const saves = getLocalSaves();
	setLocalSaves(saves.filter(({id}) => save.id !== id));
}

function onFileUpload() {
	const file = localSaveFileInput.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = () => {
		try {
			const data = reader.result;
			if (data instanceof ArrayBuffer) {
				throw new Error('File is encoded incorrectly');
			}

			createLocalSave(filenameToSaveName(file.name), data);
		} catch (err) {
			console.error(err);
			localSaveError.textContent = 'There was an error when uploading your save. Please try again later.';
			showLocalSaveError(true);
		}
	};
	reader.readAsText(file);
}

export function createLocalSave(name: string, data: string) {
	const saves = getLocalSaves();
	const largestId = parseInt(saves.sort(
		({id: idA}, {id: idB}) => parseInt(idB) - parseInt(idA)
	)?.[0]?.id) || 0;

	console.log(largestId);

	const save: Save = {
		id: (largestId + 1).toString(),
		name,
		data,
		screenshot: '1',
	};
	saves.push(save);

	setLocalSaves(saves);
	populateSavesSection(SaveType.Local, saves, deleteLocalSave);
}

export function downloadConfig() {
	const config = getCurrentConfig();

	const configString = JSON.stringify(config);
	const configData = new Blob([configString], {type: 'application/json'});
	const configUrl = URL.createObjectURL(configData);

	const link = document.createElement('a');
	link.href = configUrl;
	link.download = 'config.json';
	link.click();
}

function filenameToSaveName(filename: string): string {
	return filename.split('.').slice(0, -1).join('.')
		.split(' ').map((part) => part[0].toUpperCase() + part.substring(1)).join(' ');
}

function populateLocalSaves() {
	showLocalSaveError(false);

	let saves: Save[];
	try {
		saves = getLocalSaves();
	} catch (err) {
		console.error(err);
		localSaveError.textContent = 'There was an error loading local saves. Please try again later.';
		showLocalSaveError(true);
		return;
	}

	populateSavesSection(SaveType.Local, saves, deleteLocalSave);
}

export function onload() {
	populateLocalSaves();

	uploadLocalSaveButton.addEventListener('click', () => localSaveFileInput.click());
	localSaveFileInput.addEventListener('change', onFileUpload);
}