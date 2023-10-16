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

		showView(page);
	} catch (err) {
		console.error(err);
		showView(errorAlert);
	}
}

async function populatePresets() {
	presetsTableBody.innerHTML = '';
	const presets = await fetchPresets();

	presets.forEach((save) => {
		const row = makePresetTableRow(save);
		presetsTableBody.appendChild(row);
	});
}

function makePresetTableRow(save: Save): HTMLTableRowElement {
	const row = document.createElement('tr');

	const header = document.createElement('th');
	header.scope = 'row';
	header.textContent = save.name;
	row.appendChild(header);

	const imageField = document.createElement('td');
	imageField.style.width = '25%';
	row.appendChild(imageField);

	const image = document.createElement('img');
	image.alt = `${save.name} screenshot`;
	image.src = `${backendOrigin}/screenshot/${save.screenshot}.jpg`;
	image.classList.add('img-thumbnail');
	imageField.appendChild(image);

	const dataField = document.createElement('td');
	row.appendChild(dataField);

	const dataLink = document.createElement('a');
	dataLink.textContent = 'Click to show data';
	dataLink.href = '#';
	dataField.appendChild(dataLink);

	const actions = document.createElement('td');
	row.appendChild(actions);

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
