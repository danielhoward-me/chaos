import './../styles/admin.css';

import {fetchPresets, fetchUserSaves} from './../lib/backend';
import {backendOrigin} from './../lib/paths';
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
	imageField.appendChild(image);

	const actions = document.createElement('td');
	actions.classList.add('preset-actions-field');
	row.appendChild(actions);

	const downloadDataButton = document.createElement('button');
	downloadDataButton.classList.add('btn');
	downloadDataButton.classList.add('btn-primary');
	downloadDataButton.textContent = ' Download data';
	actions.appendChild(downloadDataButton);

	const downloadIcon = document.createElement('i');
	downloadIcon.classList.add('bi');
	downloadIcon.classList.add('bi-download');
	downloadDataButton.prepend(downloadIcon);

	const deleteDataButton = document.createElement('button');
	deleteDataButton.classList.add('btn');
	deleteDataButton.classList.add('btn-danger');
	deleteDataButton.textContent = ' Delete preset';
	actions.appendChild(deleteDataButton);

	const deleteIcon = document.createElement('i');
	deleteIcon.classList.add('bi');
	deleteIcon.classList.add('bi-trash');
	deleteDataButton.prepend(deleteIcon);

	return row;
}

function onload() {
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
