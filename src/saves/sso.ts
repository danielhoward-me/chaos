import {$, makeClassToggler} from './../core';
import {fetchUserSaves, deleteSave} from './backend';
import {ssoPath} from './paths';
import {SaveType, populateSavesSection} from './selector';

import type {Account, BackendResponse, LocalStorageAuth} from './../types.d';

const loginButton = $<HTMLButtonElement>('loginButton');
const logoutButton = $('logoutButton');
const loginLoading = $('loginLoading');
const loginLoadingText = $('loginLoadingText');
const loginError = $('loginError');
const refreshCloudSavesButton = $('refreshCloudSavesButton');

const loggedInView = $('loggedInView');

const showLoginButton = makeClassToggler(loginButton, 'hidden', true);
const showLoadingInfo = makeClassToggler(loginLoading, 'hidden', true, (enabled) => loginButton.disabled = enabled);
const showLoggedInView = makeClassToggler(loggedInView, 'hidden', true);
const showLoginError = makeClassToggler(loginError, 'hidden', true);
const setLoginError = (value: string | undefined) => {
	loginError.textContent = value;
	showLoginError(!!value);
};

let loginWindow: Window;

function onLoginClick() {
	if (loginWindow?.closed === false) return loginWindow.focus();

	setLoginError(null);
	showLoadingInfo(true);
	loginLoadingText.textContent = 'Waiting for authentication in popup window';
	loginWindow = window.open(ssoPath, '', 'width=500, height=600');

	const interval = setInterval(() => {
		// Test if the page has been closed
		if (loginWindow.closed) {
			showLoadingInfo(false);
			clearInterval(interval);
			return;
		}

		// Test if the origin has changed, meaning it has been authed
		let originsMatch = false;
		try {
			originsMatch = window.location.origin === loginWindow.location.origin;
		} catch (err) {
			// Ignore error thrown by browser since it is expected when on a different origin
		}
		if (originsMatch && localStorage.getItem('auth') !== null) {
			clearInterval(interval);
			loginWindow.close();
			refreshServerResponse();
		}
	}, 1000);
}

async function refreshServerResponse() {
	showLoadingInfo(true);
	loginLoadingText.textContent = 'Fetching your saves from the server';

	let res: BackendResponse;
	try {
		res = await fetchUserSaves();
	} catch (err) {
		console.error(err);
		setLoginError(`There was an error when logging you in. Please try again later.`);
		return logout();
	}

	populateAccountDetails(res.account);
	populateSavesSection(SaveType.Cloud, res.saves, (save) => deleteSave(save.id));

	showLoadingInfo(false);
	showLoginButton(false);
	showLoggedInView(true);
}

function populateAccountDetails(account: Account) {
	loggedInView.querySelector('#username').textContent = account.username;
	loggedInView.querySelector<HTMLImageElement>('#profilePicture').src = `${account.profilePicture}&s=50`;
}

export function getAuthStorage(): LocalStorageAuth {
	const auth = JSON.parse(localStorage.getItem('auth')) as LocalStorageAuth;
	if (auth.expires < Date.now()) throw new Error('accessToken expired');
	return auth;
}

function logout() {
	localStorage.removeItem('auth');
	showLoadingInfo(false);
	showLoginButton(true);
	showLoggedInView(false);
	populateSavesSection(SaveType.Cloud, null);
}

export function onload() {
	loginButton.addEventListener('click', onLoginClick);
	logoutButton.addEventListener('click', logout);
	refreshCloudSavesButton.addEventListener('click', refreshServerResponse);

	if (localStorage.getItem('auth') !== null) refreshServerResponse();
}
