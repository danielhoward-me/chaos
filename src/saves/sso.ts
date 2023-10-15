import {$, makeClassToggler} from './../core';
import {fetchUserSaves, deleteSave} from './../lib/backend';
import {ssoOrigin} from './../lib/paths';
import {hasAuthInStorage, openLoginPopup} from './../lib/sso';
import {SaveType, populateSavesSection} from './selector';

import type {Account, BackendResponse} from './../types.d';

const loginButton = $<HTMLButtonElement>('loginButton');
const logoutButton = $('logoutButton');
const loginLoading = $('loginLoading');
const loginLoadingText = $('loginLoadingText');
const loginError = $('loginError');
const viewCloudSavesRequireLogin = $('viewCloudSavesRequireLogin');
const cloudSavesRequireLogin = $('cloudSavesRequireLogin');
const loggedInView = $('loggedInView');

const showLoginButton = makeClassToggler(loginButton, 'hidden', true);
const showLoadingInfo = makeClassToggler(loginLoading, 'hidden', true, (enabled) => loginButton.disabled = enabled);
const showLoggedInView = makeClassToggler(loggedInView, 'hidden', true);
const showLoginError = makeClassToggler(loginError, 'hidden', true);
const showViewCloudSavesRequireLogin = makeClassToggler(viewCloudSavesRequireLogin, 'hidden', true);
const showCloudSavesRequireLogin = makeClassToggler(cloudSavesRequireLogin, 'hidden', true, showViewCloudSavesRequireLogin);
const setLoginError = (value: string | undefined) => {
	loginError.textContent = value;
	showLoginError(!!value);
};

const statusChangeCallbacks: ((loggedIn: boolean) => void)[] = [];

async function onLoginClick() {
	setLoginError(null);
	showLoadingInfo(true);
	loginLoadingText.textContent = 'Waiting for authentication in popup window';

	const loggedIn = await openLoginPopup();
	if (loggedIn) {
		refreshServerResponse();
	} else {
		showLoadingInfo(false);
	}
}

async function refreshServerResponse() {
	runCallbacks(false);
	showLoadingInfo(true);
	showLoggedInView(false);
	showCloudSavesRequireLogin(true);
	populateSavesSection(SaveType.Cloud, null);
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

	runCallbacks(true);
	showLoadingInfo(false);
	showLoginButton(false);
	showCloudSavesRequireLogin(false);
	showLoggedInView(true);
}

function populateAccountDetails(account: Account) {
	loggedInView.querySelector('#username').textContent = account.username;
	loggedInView.querySelector<HTMLAnchorElement>('#accountButton').href = `${ssoOrigin}/account`;
	loggedInView.querySelector<HTMLImageElement>('#profilePicture').src = `${account.profilePicture}&s=50`;

	if (account.admin) {
		const adminLink = document.createElement('a');
		adminLink.href = `/admin${window.location.search}`;
		adminLink.target = '_blank';
		adminLink.classList.add('btn');
		adminLink.classList.add('btn-outline-primary');
		adminLink.textContent = ' Admin';
		adminLink.id = 'adminButton';

		const gearIcon = document.createElement('i');
		gearIcon.classList.add('bi');
		gearIcon.classList.add('bi-gear');
		adminLink.prepend(gearIcon);

		loggedInView.querySelector('#profileButtons').prepend(adminLink);
	}
}

function logout() {
	localStorage.removeItem('auth');
	showLoadingInfo(false);
	showLoginButton(true);
	showLoggedInView(false);
	showCloudSavesRequireLogin(true);
	populateSavesSection(SaveType.Cloud, null);
	loggedInView.querySelector('#adminButton')?.remove();

	runCallbacks(false);
}

function runCallbacks(loggedIn: boolean) {
	statusChangeCallbacks.forEach((f) => f(loggedIn));
}

export function onLoginStatusChange(callback: (loggedIn: boolean) => void) {
	statusChangeCallbacks.push(callback);
}

export function onload() {
	loginButton.addEventListener('click', onLoginClick);
	logoutButton.addEventListener('click', logout);

	if (hasAuthInStorage()) {
		showLoginButton(false);
		refreshServerResponse();
	}
}
