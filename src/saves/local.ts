import {$, makeClassToggler} from './../core';
import {requestScreenshot} from './../lib/backend';
import {download, filenameToSaveName, readFile} from './../lib/files';
import {getCurrentConfig} from './config';
import {SaveType, addSaveToSection, populateSavesSection} from './selector';

import type {Save} from './../types.d';

const localSaveFileInput = $<HTMLInputElement>('localSaveFileInput');
const uploadLocalSaveButton = $<HTMLButtonElement>('uploadLocalSaveButton');
const localSaveError = $('localSaveError');
const uploadLocalSaveLoading = $('uploadLocalSaveLoading');

const showLocalSaveError = makeClassToggler(localSaveError, 'hidden', true);
const showUploadLocalSaveLoading = makeClassToggler(uploadLocalSaveLoading, 'hidden', true, (enabled) => uploadLocalSaveButton.disabled = enabled);

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

async function onFileUpload() {
	showUploadLocalSaveLoading(true);

	try {
		const {name, content} = await readFile(localSaveFileInput);

		const {hash} = await requestScreenshot(content);
		const save = createLocalSave(filenameToSaveName(name), content, hash);
		addSaveToSection(SaveType.Local, save);
	} catch (err) {
		console.error(err);
		localSaveError.textContent = 'There was an error when uploading your save. Please try again later.';
		showLocalSaveError(true);
	}

	showUploadLocalSaveLoading(false);
}

export function createLocalSave(name: string, data: string, hash: string): Save {
	const saves = getLocalSaves();
	const largestId = parseInt(saves.sort(
		({id: idA}, {id: idB}) => parseInt(idB) - parseInt(idA)
	)?.[0]?.id) || 0;

	const save: Save = {
		id: (largestId + 1).toString(),
		name,
		data,
		screenshot: hash,
	};
	saves.push(save);

	setLocalSaves(saves);
	return save;
}

export function downloadConfig() {
	const config = getCurrentConfig();
	const configString = JSON.stringify(config);

	download('config.json', configString);
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
