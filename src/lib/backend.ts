import {backendOrigin} from './paths';
import {getAuthStorage} from './sso';

import type {ScreenshotStatus} from './../constants';
import type {Admin, BackendResponse, Save} from './../types.d';

async function makeRequest<T>(path: string, includeAuth = false, authRequired = false, method: 'GET' | 'POST' | 'DELETE' = 'GET', body: null | unknown = null): Promise<T> {
	const fetchOptions: RequestInit = {
		method: method,
		headers: {},
	};

	if (includeAuth) {
		try {
			const auth = getAuthStorage();
			fetchOptions.headers['Authorization'] = `Bearer ${auth.accessToken}`;
		} catch (err) {
			if (authRequired) throw err;
		}
	}

	if (body !== null) {
		fetchOptions.body = JSON.stringify(body);
		fetchOptions.headers['Content-Type'] = 'application/json';
	}

	const res = await fetch(`${backendOrigin}${path}`, fetchOptions);
	if (!res.ok) throw new Error('chaos-backend returned a non-ok response');

	return await res.json() as T;
}

export async function fetchUserSaves(): Promise<BackendResponse> {
	return await makeRequest('/account', true);
}

export async function fetchPresets(): Promise<Save[]> {
	return await makeRequest('/saves/presets');
}

export async function deleteSave(id: string) {
	return await makeRequest(`/saves/delete?id=${id}`, true, true, 'DELETE');
}

export async function makeCloudSave(name: string, data: string, isPreset: boolean): Promise<{save: Save}> {
	return await makeRequest('/saves/create', true, true, 'POST', {name, data, isPreset});
}

export async function requestScreenshot(data: string, forceNew = false): Promise<{hash: string}> {
	return await makeRequest('/screenshot', true, false, 'POST', {data, forceNew});
}

export async function getScreenshotStatus(hash: string): Promise<{status: ScreenshotStatus}> {
	return await makeRequest(`/screenshot/status?hash=${hash}`);
}

export async function changeSaveName(id: string, name: string) {
	return await makeRequest(`/saves/edit?id=${id}`, true, true, 'POST', {name});
}

export async function fetchAdmins(): Promise<Admin[]> {
	return await makeRequest(`/admins`, true, true);
}

export async function removeAdmin(id: string) {
	return await makeRequest(`/admins/remove?id=${id}`, true, true, 'DELETE');
}

export async function addNewAdmin(username: string): Promise<{exists: boolean, alreadyAdmin: boolean}> {
	return await makeRequest(`/admins/new`, true, true, 'POST', {username});
}
