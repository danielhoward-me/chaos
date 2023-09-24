import {backendOrigin, backendQuery} from './paths';
import {getAuthStorage} from './sso';

import type {BackendResponse} from './../types.d';

function getBackendUrl(path: string): string {
	let url = `${backendOrigin}${path}${backendQuery}`;

	while (url.match(/\?/g).length > 1) {
		url = url.replace(/\?([^?]*)$/, '&$1');
	}

	return url;
}

async function makeRequest<T>(path: string, includeAuth = false): Promise<T> {
	const headers: HeadersInit = {};

	if (includeAuth) {
		const auth = getAuthStorage();
		headers['Authorization'] = `Bearer ${auth.accessToken}`;
	}

	const res = await fetch(getBackendUrl(path), {headers});
	if (!res.ok) throw new Error('chaos-backend returned a non-ok response');

	return await res.json() as T;
}

export async function fetchUserSaves(): Promise<BackendResponse> {
	return await makeRequest('/account', true);
}

export async function deleteSave(id: string) {
	return await makeRequest(`/delete?id=${id}`, true);
}
