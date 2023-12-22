import {backendOrigin} from './paths';
import {getAuthStorage} from './sso';

import type {ScreenshotStatus} from './../constants';
import type {BackendResponse, Save} from './../types.d';

async function makeRequest<T>(path: string, includeAuth = false, method: 'GET' | 'POST' | 'DELETE' = 'GET', body: null | unknown = null): Promise<T> {
	const fetchOptions: RequestInit = {
		method: method,
		headers: {},
	};

	if (includeAuth) {
		const auth = getAuthStorage();
		fetchOptions.headers['Authorization'] = `Bearer ${auth.accessToken}`;
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
	return await makeRequest(`/saves/delete?id=${id}`, true, 'DELETE');
}

export async function makeCloudSave(name: string, data: string, isPreset: boolean): Promise<{save: Save}> {
	return await makeRequest('/saves/create', true, 'POST', {name, data, isPreset});
}

export async function requestScreenshot(data: string): Promise<{hash: string}> {
	return await makeRequest('/screenshot', false, 'POST', {data});
}

export async function getScreenshotStatus(hash: string): Promise<{status: ScreenshotStatus}> {
	return await makeRequest(`/screenshot/status?hash=${hash}`, false);
}

export async function changeSaveName(id: string, name: string) {
	return await makeRequest(`/saves/edit?id=${id}`, true, 'POST', {name});
}
