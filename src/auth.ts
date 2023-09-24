import {$, makeClassToggler} from './core';

import type {BackendAccount, BackendAccountResponse, BackendSave, LocalStorageAuth} from './types.d';

const loginButton = $<HTMLButtonElement>('loginButton');
const logoutButton = $('logoutButton');
const loginLoading = $('loginLoading');
const loginLoadingText = $('loginLoadingText');

const loggedInView = $('loggedInView');

const showLoginButton = makeClassToggler(loginButton, 'hidden', true);
const showLoadingInfo = makeClassToggler(loginLoading, 'hidden', true, (enabled) => loginButton.disabled = enabled);
const showLoggedInView = makeClassToggler(loggedInView, 'hidden', true);

const isDevelopment = process.env.NODE_ENV === 'development';
const searchParams = new URLSearchParams(window.location.search);

const ssoDevPort = searchParams.get('ssodevport');
const ssoOrigin = ssoDevPort === null ? 'https://sso.danielhoward.me' : `http://local.danielhoward.me:${ssoDevPort}`;
const ssoPath = `${ssoOrigin}/auth?target=chaos${isDevelopment ? '&devport=3001' : ''}`;

const backendDevPort = searchParams.get('backenddevport');
const backendOrigin = backendDevPort === null ? 'https://chaos-backend.danielhoward.me' : `http://local.danielhoward.me:${backendDevPort}`;
const backendQuery = ssoDevPort === null ? '' : `?ssodevport=${ssoDevPort}`;

let loginWindow: Window;

function onLoginClick() {
	if (loginWindow?.closed === false) return loginWindow.focus();

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
		if (originsMatch) {
			clearInterval(interval);
			loginWindow.close();
			onAuth();
		}
	}, 1000);
}

function onAuth() {
	showLoadingInfo(true);
	loginLoadingText.textContent = 'Fetching your saves from the server';
	fetchUserSaves();
}

async function fetchUserSaves() {
	const auth = getAuthStorage();
	if (!auth) return;

	const res = await fetch(`${backendOrigin}/account${backendQuery}`, {
		headers: {
			'Authorization': `Bearer ${auth.accessToken}`,
		},
	});

	if (!res.ok) return logout();

	const {account, saves} = await res.json() as BackendAccountResponse;
	populateAccountDetails(account);
	populateUserSaves(saves);

	showLoadingInfo(false);
	showLoginButton(false);
	showLoggedInView(true);
}

function populateAccountDetails(account: BackendAccount) {
	loggedInView.querySelector('#username').textContent = account.username;
	loggedInView.querySelector<HTMLImageElement>('#profilePicture').src = account.profilePicture;
}
function populateUserSaves(saves: BackendSave[]) {
	//
}

function getAuthStorage(): LocalStorageAuth | void {
	try {
		const auth = JSON.parse(localStorage.getItem('auth')) as LocalStorageAuth;
		if (auth.expires < Date.now()) throw new Error('accessToken expired');
		return auth;
	} catch (err) {
		console.error(err);
		logout();
	}
}

function logout() {
	localStorage.removeItem('auth');
	showLoadingInfo(false);
	showLoginButton(true);
	showLoggedInView(false);
}

export function onload() {
	loginButton.addEventListener('click', onLoginClick);
	logoutButton.addEventListener('click', logout);

	if (localStorage.getItem('auth') !== null) onAuth();
}
