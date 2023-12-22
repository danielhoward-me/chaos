import './../styles/admin.css';
import './../styles/screenshot.css';

import {changeSaveName, deleteSave, fetchPresets, fetchUserSaves, makeCloudSave} from './../lib/backend';
import {download, filenameToSaveName, readFile} from './../lib/files';
import {backendOrigin} from './../lib/paths';
import {getGeneratingScreenshotElement, beginMissingScreenshotSequence} from './../lib/screenshot';
import {hasAuthInStorage, openLoginPopup} from './../lib/sso';

import type {Save} from './../types.d';

function $<T extends HTMLElement = HTMLElement>(id: string): T {
	return <T> document.getElementById(id);
}

const errorAlert = $('errorAlert');
const unauthorisedAlert = $('unauthorisedAlert');

const loading = $('loading');

const login = $('login');
const loginButton = $('loginButton');

const page = $('page');

const presetsTableBody = $('presetsTableBody');
const noPresetsMessage = $('noPresetsMessage');
const newPresetButton = $<HTMLButtonElement>('newPresetButton');
const newPresetInput = $<HTMLInputElement>('newPresetInput');
const newPresetsError = $('newPresetsError');

const adminSsoMessage = $('adminSsoMessage');

function showView(show: HTMLElement) {
	([
		errorAlert,
		unauthorisedAlert,
		loading,
		login,
		page,
	]).forEach((c) => c.classList.toggle('hidden', c !== show));
}

async function init() {
	try {
		const {account} = await fetchUserSaves();

		if (!account.admin) {
			showView(unauthorisedAlert);
			return;
		}

		await populatePresets();

		if (account.ssoAdmin) await populateAdmins();
		else adminSsoMessage.classList.remove('hidden');

		showView(page);
	} catch (err) {
		console.error(err);
		showView(errorAlert);
	}
}

async function populatePresets() {
	noPresetsMessage.classList.add('hidden');
	presetsTableBody.innerHTML = '';
	const presets = await fetchPresets();

	if (presets.length === 0) {
		noPresetsMessage.classList.remove('hidden');
		return;
	}

	presets.forEach((save) => {
		const row = makePresetTableRow(save);
		presetsTableBody.appendChild(row);
	});
}

async function populateAdmins() {
	//
}

function makePresetTableRow(save: Save): HTMLTableRowElement {
	const row = document.createElement('tr');

	const header = document.createElement('th');
	header.scope = 'row';
	header.textContent = save.name;
	header.classList.add('preset-name-field');
	row.appendChild(header);

	const imageField = document.createElement('td');
	imageField.style.width = '25%';
	row.appendChild(imageField);

	const image = document.createElement('img');
	image.alt = `${save.name} screenshot`;
	image.src = `${backendOrigin}/screenshot/${save.screenshot}.jpg`;
	image.classList.add('img-thumbnail');
	image.style.padding = '0';
	image.addEventListener('error', () => {
		image.classList.add('hidden');
		const placeHolder = getGeneratingScreenshotElement();
		placeHolder.style.textAlign = 'center';
		imageField.prepend(placeHolder);
		beginMissingScreenshotSequence(image, placeHolder, save.screenshot, save.data);
	});
	imageField.appendChild(image);

	const actions = document.createElement('td');
	actions.classList.add('preset-actions-field');
	row.appendChild(actions);

	const editNameButton = document.createElement('button');
	editNameButton.classList.add('btn');
	editNameButton.classList.add('btn-outline-primary');
	editNameButton.textContent = ' Change Name';
	editNameButton.addEventListener('click', () => changePresetName(save.id, header, editNameButton));
	actions.appendChild(editNameButton);

	const editIcon = document.createElement('i');
	editIcon.classList.add('bi');
	editIcon.classList.add('bi-pencil-square');
	editNameButton.prepend(editIcon);

	const downloadDataButton = document.createElement('button');
	downloadDataButton.classList.add('btn');
	downloadDataButton.classList.add('btn-primary');
	downloadDataButton.textContent = ' Download data';
	downloadDataButton.addEventListener('click', () => download(`${save.name}.json`, save.data));
	actions.appendChild(downloadDataButton);

	const downloadIcon = document.createElement('i');
	downloadIcon.classList.add('bi');
	downloadIcon.classList.add('bi-download');
	downloadDataButton.prepend(downloadIcon);

	const deleteButton = document.createElement('button');
	deleteButton.classList.add('btn');
	deleteButton.classList.add('btn-danger');
	deleteButton.textContent = ' Delete Preset';
	deleteButton.addEventListener('click', () => deletePreset(save.id, deleteButton));
	actions.appendChild(deleteButton);

	const deleteIcon = document.createElement('i');
	deleteIcon.classList.add('bi');
	deleteIcon.classList.add('bi-trash');
	deleteButton.prepend(deleteIcon);

	return row;
}

function createErrorElement(error: string): HTMLDivElement {
	const div = document.createElement('div');
	div.classList.add('error-text');
	div.textContent = error;
	return div;
}

function buttonLoading(loading: boolean, button: HTMLButtonElement) {
	if (loading) {
		const spinner = document.createElement('span');
		spinner.classList.add('spinner-border');
		spinner.classList.add('spinner-border-sm');
		spinner.style.marginRight = '4px';
		spinner.id = 'buttonLoader';

		button.prepend(spinner);
		button.disabled = true;
	} else {
		button.querySelector('#buttonLoader').remove();
		button.disabled = false;
	}
}

async function changePresetName(id: string, nameElement: HTMLTableCellElement, editNameButton: HTMLButtonElement) {
	buttonLoading(true, editNameButton);
	editNameButton.parentElement.querySelector('#createNameError')?.remove();

	const name = prompt('What would you like to change the name to?', nameElement.textContent);

	if (name === null || name === '') {
		buttonLoading(false, editNameButton);
		return;
	}

	try {
		await changeSaveName(id, name);
	} catch (err) {
		console.error(err);

		const errorElemet = createErrorElement(`There was an error when changing the preset's name`);
		errorElemet.id = 'createNameError';
		editNameButton.parentElement.append(errorElemet);

		buttonLoading(false, editNameButton);
		return;
	}

	nameElement.textContent = name;

	buttonLoading(false, editNameButton);
}

async function deletePreset(id: string, deleteButton: HTMLButtonElement) {
	buttonLoading(true, deleteButton);
	deleteButton.parentElement.querySelector('#deleteError')?.remove();

	try {
		await deleteSave(id);
	} catch (err) {
		console.error(err);

		const errorElemet = createErrorElement('There was an error when deleting the preset');
		errorElemet.id = 'deleteError';
		deleteButton.parentElement.append(errorElemet);

		buttonLoading(false, deleteButton);
		return;
	}

	populatePresets();
}

async function onPresetUpload() {
	buttonLoading(true, newPresetButton);
	newPresetsError.textContent = '';

	try {
		const {name, content} = await readFile(newPresetInput);

		await makeCloudSave(filenameToSaveName(name), content, true);

		populatePresets();
	} catch (err) {
		console.error(err);
		newPresetsError.textContent = 'There was an error when creating a new preset';

		buttonLoading(false, newPresetButton);
		return;
	}

	buttonLoading(false, newPresetButton);
}

function onload() {
	newPresetButton.addEventListener('click', () => newPresetInput.click());
	newPresetInput.addEventListener('change', onPresetUpload);

	if (hasAuthInStorage()) {
		init();
	} else {
		loginButton.addEventListener('click', async () => {
			const loggedIn = await openLoginPopup();
			if (loggedIn) {
				showView(loading);
				init();
			}
		});

		showView(login);
	}
}

window.addEventListener('DOMContentLoaded', onload);
