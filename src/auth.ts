import {$, makeClassToggler} from './core';

const loginButton = $<HTMLButtonElement>('loginButton');
const loginLoading = $('loginLoading');
const loginLoadingText = $('loginLoadingText');

const showLoadingInfo = makeClassToggler(loginLoading, 'hidden', true, (enabled) => loginButton.disabled = enabled);

const isDevelopment = process.env.NODE_ENV === 'development';
const searchParams = new URLSearchParams(window.location.search);

const ssoDevPort = searchParams.get('ssodevport');
const ssoOrigin = ssoDevPort === null ? 'https://sso.danielhoward.me' : `http://local.danielhoward.me:${ssoDevPort}`;
const ssoPath = `${ssoOrigin}/auth?target=chaos${isDevelopment ? '&devport=3001' : ''}`;

const backendDevPort = searchParams.get('backenddevport');
const backendOrigin = backendDevPort === null ? 'https://chaos-backend.danielhoward.me' : `http://local.danielhoward.me:${backendDevPort}`;

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
	loginLoadingText.textContent = 'Fetching your saves from the server';
}

export function onload() {
	loginButton.addEventListener('click', onLoginClick);
}
