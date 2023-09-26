import {backendOrigin} from './paths';
import {getAuthStorage} from './sso';

import type {BackendResponse, Save} from './../types.d';

async function makeRequest<T>(path: string, includeAuth = false, postBody: null | unknown = null): Promise<T> {
	const fetchOptions: RequestInit = {
		method: postBody === null ? 'GET' : 'POST',
		headers: {},
	};

	if (includeAuth) {
		const auth = getAuthStorage();
		fetchOptions.headers['Authorization'] = `Bearer ${auth.accessToken}`;
	}

	if (postBody !== null) {
		fetchOptions.body = JSON.stringify(postBody);
		fetchOptions.headers['Content-Type'] = 'application/json';
	}

	const res = await fetch(`${backendOrigin}${path}`, fetchOptions);
	if (!res.ok) throw new Error('chaos-backend returned a non-ok response');

	return await res.json() as T;
}

export async function fetchPresets(): Promise<Save[]> {
	return await makeRequest('/presets');
}

export async function fetchUserSaves(): Promise<BackendResponse> {
	return await makeRequest('/account', true);
}

export async function deleteSave(id: string) {
	return await makeRequest(`/delete?id=${id}`, true);
}

export async function makeCloudSave(name: string, data: string): Promise<{save: Save, screenshotTime: number}> {
	return await makeRequest('/create', true, {name, data});
}

export async function requestScreenshot(data: string): Promise<{screenshotTime: number}> {
	return await makeRequest('/screenshot', false, {data});
}
