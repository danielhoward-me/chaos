import './../styles/admin.css';
import './../styles/screenshot.css';

import {fetchUserSaves} from './../lib/backend';
import {hasAuthInStorage, openLoginPopup} from './../lib/sso';
import {onload as adminsOnload, populateAdmins, adminSsoMessage, adminListContainer} from './admins';
import {onload as presetsOnload, populatePresets} from './presets';
import {onload as screenshotsOnload} from './screenshots';

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
	return <T> document.getElementById(id);
}

const errorAlert = $('errorAlert');
const unauthorisedAlert = $('unauthorisedAlert');

const loading = $('loading');

const login = $('login');
const loginButton = $('loginButton');

const page = $('page');

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

		if (account.ssoAdmin) {
			await populateAdmins();
			adminListContainer.classList.remove('hidden');
		} else adminSsoMessage.classList.remove('hidden');

		showView(page);
	} catch (err) {
		console.error(err);
		showView(errorAlert);
	}
}

export function createErrorElement(error: string): HTMLDivElement {
	const div = document.createElement('div');
	div.classList.add('error-text');
	div.textContent = error;
	return div;
}

export function buttonLoading(loading: boolean, button: HTMLButtonElement) {
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

function onload() {
	adminsOnload();
	presetsOnload();
	screenshotsOnload();

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
