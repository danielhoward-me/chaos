import {SetupStage} from './../constants';
import {$, makeClassToggler} from './../core';
import {getSetupStage} from './../setup/setup';
import {makeCloudSave, requestScreenshot} from './backend';
import {getCurrentConfig} from './config';
import {createLocalSave, downloadConfig} from './local';
import {SaveType, addSaveToSection} from './selector';
import {onLoginStatusChange} from './sso';

import type {Save} from './../types.d';

type DownloadSaveTypes = SaveType.Local | SaveType.Cloud;

const createSaveContainer = $('createSaveContainer');
const cloudSavesRequireLogin = $('cloudSavesRequireLogin');
const createSaveForm = $('createSaveForm');
const saveNameInput = $<HTMLInputElement>('saveNameInput');
const createSaveLoading = $('createSaveLoading');
const createSaveButton = $<HTMLButtonElement>('createSaveButton');

const showCreateSaveContainer = makeClassToggler(createSaveContainer, 'hidden', true);
const showCreateSaveForm = makeClassToggler(createSaveForm, 'hidden', true);
const showCreateSaveLoading = makeClassToggler(createSaveLoading, 'hidden', true, (enabled) => createSaveButton.disabled = enabled);

const createSaveError = $('createSaveError');
const showCreateSaveError = makeClassToggler(createSaveError, 'hidden', true);
export function setCreateSaveError(value: string | undefined) {
	createSaveError.textContent = value;
	showCreateSaveError(!!value);
}

const downloadConfigButton = $('downloadConfigButton');
const saveButtons: Partial<Record<SaveType, HTMLElement>> = {
	[SaveType.Local]: $('saveLocalButton'),
	[SaveType.Cloud]: $('saveCloudButton'),
};
const saveButtonsTogglers = Object.entries(saveButtons).reduce<Record<string, (force: boolean) => void>>(
	(acc, [type, container]) => {
		acc[type] = makeClassToggler(container, 'btn-primary', false, (enabled) => {
			saveButtons[type].classList.toggle('btn-outline-primary', !enabled);
		});
		return acc;
	}, {},
);

let currentType: DownloadSaveTypes | null = null;

function setOptionsViewable(type: DownloadSaveTypes | null) {
	currentType = currentType == type ? null : type;

	setCreateSaveError(undefined);
	showCreateSaveContainer(false);
	showCreateSaveForm(false);
	Object.values(saveButtonsTogglers).forEach((f) => f(false));

	if (currentType === null) return;

	saveButtonsTogglers[type](true);
	showCreateSaveContainer(true);

	cloudSavesRequireLogin.style.display = currentType === SaveType.Cloud ? '' : 'none';
	if (currentType === SaveType.Cloud && !cloudSavesRequireLogin.classList.contains('hidden')) return;

	showCreateSaveForm(true);
}

function onDownloadClick() {
	setOptionsViewable(null);
	if (!saveCanBeMade()) return;
	downloadConfig();
}

function saveCanBeMade(): boolean {
	const config = getCurrentConfig();
	setCreateSaveError('');

	// If the stage isn't high enough to generate points, display error
	if (getSetupStage() < SetupStage.GeneratePoints) {
		const shapeType = config.stages[SetupStage.ShapeType].shapeType;
		const error = `Please ${shapeType === 'custom' ? 'draw atleast three points' : 'select a shape type'} before creating a save`;
		setCreateSaveError(error);
		return false;
	}

	return true;
}

async function onSaveFormSubmitted(ev: SubmitEvent) {
	ev.preventDefault();

	const name = saveNameInput.value;
	if (name === '') {
		setCreateSaveError('Please enter a name to create the save under');
		return;
	}

	if (!saveCanBeMade()) return;

	showCreateSaveLoading(true);

	const data = JSON.stringify(getCurrentConfig());

	let save: Save;
	let screenshotTime = 0;
	try {
		switch (currentType) {
		case SaveType.Local:
			save = createLocalSave(name, data);
			screenshotTime = (await requestScreenshot(data)).screenshotTime;
			break;
		case SaveType.Cloud: {
			const newSave = await makeCloudSave(name, data);
			save = newSave.save;
			screenshotTime = newSave.screenshotTime;
			break;
		}
		}
	} catch (err) {
		console.error(err);
		setCreateSaveError('There was an error when creating your save. Please try again later.');
		showCreateSaveLoading(false);
		return;
	}

	setTimeout(() => {
		showCreateSaveLoading(false);
		saveNameInput.value = '';
		addSaveToSection(currentType, save);
	}, Math.min(screenshotTime, 25000));
}

export function onload() {
	Object.entries(saveButtons).forEach(([type, button]) => {
		button.addEventListener('click', () => {
			setOptionsViewable(type as DownloadSaveTypes);
		});
	});
	downloadConfigButton.addEventListener('click', onDownloadClick);

	onLoginStatusChange((loggedIn) => {
		if (currentType === SaveType.Cloud) {
			showCreateSaveForm(loggedIn);
		}
	});

	createSaveForm.addEventListener('submit', onSaveFormSubmitted);
}
