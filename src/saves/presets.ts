import {$, makeClassToggler} from './../core';
import {fetchPresets} from './../lib/backend';
import {SaveType, populateSavesSection} from './selector';

import type {Save} from './../types.d';

const presetsLoading = $('presetsLoading');
const presetsError = $('presetsError');

const showPresetsLoading = makeClassToggler(presetsLoading, 'hidden', true);
const showPresetsError = makeClassToggler(presetsError, 'hidden', true);

async function populatePresets() {
	showPresetsLoading(true);
	showPresetsError(false);

	let saves: Save[];
	try {
		saves = await fetchPresets();
	} catch (err) {
		console.error(err);
		presetsError.textContent = 'There was an error fetching presets. Please try again later.';
		showPresetsError(true);
		showPresetsLoading(false);
		return;
	}

	populateSavesSection(SaveType.Preset, saves, null);
	showPresetsLoading(false);
}

export function onload() {
	populatePresets();
}
