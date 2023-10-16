import './../styles/admin.css';

import {fetchUserSaves} from './../lib/backend';
import {hasAuthInStorage, openLoginPopup} from './../lib/sso';

import type {Account} from './../types.d';

function $<T extends HTMLElement = HTMLElement>(id: string): T {
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
	let account: Account;
	try {
		const res = await fetchUserSaves();
		account = res.account;
	} catch (err) {
		console.error(err);
		showView(errorAlert);
		return;
	}

	if (!account.admin) {
		showView(unauthorisedAlert);
		return;
	}

	showView(page);
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
