import {fetchAdmins, removeAdmin as backendRemoveAdmin, addNewAdmin} from './../lib/backend';
import {$, buttonLoading, createErrorElement} from './index';

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
	const admins = await fetchAdmins();

	noAdminsMessage.classList.add('hidden');
	adminsTableBody.innerHTML = '';

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
	accountField.style.verticalAlign = 'middle';
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
	actions.style.textAlign = 'center';
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
		const {exists, alreadyAdmin} = await addNewAdmin(username);

		if (!exists) {
			newAdminError.textContent = `There is no user with username ${username} in sso`;
			buttonLoading(false, newAdminButton);
			return;
		}

		if (alreadyAdmin) {
			newAdminError.textContent = `${username} is already an admin`;
			buttonLoading(false, newAdminButton);
			return;
		}
	} catch (err) {
		newAdminError.textContent = 'There was an error when adding a new admin';
		buttonLoading(false, newAdminButton);
		return;
	}

	await populateAdmins();

	buttonLoading(false, newAdminButton);
	newAdminUsername.value = '';
}

async function removeAdmin(id: string, deleteButton: HTMLButtonElement) {
	buttonLoading(true, deleteButton);
	deleteButton.parentElement.querySelector('#deleteAdminError')?.remove();

	try {
		await backendRemoveAdmin(id);
	} catch (err) {
		console.error(err);

		const errorElemet = createErrorElement(`There was an error when removing the admin`);
		errorElemet.id = 'deleteAdminError';
		deleteButton.parentElement.append(errorElemet);

		buttonLoading(false, deleteButton);
		return;
	}

	await populateAdmins();
}

export function onload() {
	newAdminForm.addEventListener('submit', onNewAdminSubmit);
}
