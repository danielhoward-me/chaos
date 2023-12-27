import {fetchAdmins, removeAdmin as backendRemoveAdmin} from './../lib/backend';
import {$, buttonLoading} from './index';

import type {Admin} from './../types.d';

export const adminSsoMessage = $('adminSsoMessage');
export const adminListContainer = $('adminListContainer');

const newAdminForm = $('newAdminForm');
const newAdminUsername = $<HTMLInputElement>('newAdminUsername');
const newAdminButton = $<HTMLButtonElement>('newAdminButton');
const newAdminError = $('newAdminError');
const adminsTableBody = $('adminsTableBody');
const noAdminsMessage = $('noAdminsMessage');

export async function populateAdmins() {
	noAdminsMessage.classList.add('hidden');
	adminsTableBody.innerHTML = '';

	const admins = await fetchAdmins();

	if (admins.length === 0) {
		noAdminsMessage.classList.remove('hidden');
		return;
	}

	admins.forEach((admin) => {
		const row = makeAdminTableRow(admin);
		adminsTableBody.appendChild(row);
	});
}

function makeAdminTableRow(admin: Admin): HTMLTableRowElement {
	const row = document.createElement('tr');

	const accountField = document.createElement('td');
	row.appendChild(accountField);

	const profilePicture = document.createElement('img');
	profilePicture.classList.add('admin-profile-picture');
	profilePicture.src = admin.profilePicture;
	accountField.appendChild(profilePicture);

	const username = document.createElement('span');
	username.textContent = admin.username;
	accountField.appendChild(username);

	const actions = document.createElement('td');
	actions.style.verticalAlign = 'middle';
	row.appendChild(actions);

	const deleteButton = document.createElement('button');
	deleteButton.classList.add('btn');
	deleteButton.classList.add('btn-danger');
	deleteButton.textContent = '';
	deleteButton.addEventListener('click', () => removeAdmin(admin.userId, deleteButton));
	actions.appendChild(deleteButton);

	const deleteIcon = document.createElement('i');
	deleteIcon.classList.add('bi');
	deleteIcon.classList.add('bi-trash');
	deleteButton.prepend(deleteIcon);

	return row;
}

async function onNewAdminSubmit(ev: Event) {
	ev.preventDefault();

	newAdminError.textContent = '';
	buttonLoading(true, newAdminButton);

	const username = newAdminUsername.value;

	try {
		await addNewAdmin(username);
	} catch (err) {
		newAdminError.textContent = 'There was an error when adding a new admin';
		buttonLoading(false, newAdminButton);
		return;
	}

	await populateAdmins();

	buttonLoading(false, newAdminButton);
}

async function addNewAdmin(username: string) {
	//
}

async function removeAdmin(id: string, deleteButton: HTMLButtonElement) {
	buttonLoading(true, deleteButton);

	await backendRemoveAdmin(id);

	await populateAdmins();
}

export function onload() {
	newAdminForm.addEventListener('submit', onNewAdminSubmit);
}
