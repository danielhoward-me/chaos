import {ssoPath} from './paths';

import type {LocalStorageAuth} from './../types.d';

export function getAuthStorage(): LocalStorageAuth {
	const auth = JSON.parse(localStorage.getItem('auth')) as LocalStorageAuth;
	if (!auth) throw new Error('No auth in storage');
	if (auth.expires < Date.now()) throw new Error('accessToken expired');
	return auth;
}

export function hasAuthInStorage(): boolean {
	try {
		getAuthStorage();
		return true;
	} catch (_) {
		return false;
	}
}

let loginWindow: Window;
export function openLoginPopup(): Promise<boolean> {
	return new Promise((res) => {
		if (loginWindow?.closed === false) loginWindow.focus();
		else loginWindow = window.open(ssoPath, '', 'width=500, height=600');

		const interval = setInterval(() => {
			// Test if the page has been closed
			if (loginWindow.closed) {
				clearInterval(interval);
				res(false);
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
				res(true);
			}
		}, 1000);
	});
}
