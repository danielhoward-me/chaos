import {SetupStage} from './constants';
import {$, getInputValue, setInputValue} from './core';
import {generatePoints} from './setup/generate-points';
import {stages, getSetupStage, setSetupStage} from './setup/setup';
import {useSetEquator} from './vertex-rule';

import type {SaveConfig} from './types.d';

/*
Save file version changelog:
  1:
    - Initial version
	- Breaking change was added to vertex rules by adding the set symbol
	- This updates rules to the new format then uses version 2
  2:
    - Same as version 1 but without the breaking change
*/

const CURRENT_SAVE_VERSION = 2;

const configError = $('configError');
const configUploadInput = $<HTMLInputElement>('configUploadInput');

function getCurrentConfig(): SaveConfig {
	const config: SaveConfig = {
		version: CURRENT_SAVE_VERSION,
		stages: {
			[SetupStage.ShapeType]: {},
			[SetupStage.ShapeSettings]: {},
			[SetupStage.GeneratePoints]: {},
			[SetupStage.Playback]: {},
		},
	};

	Object.keys(stages).forEach((stageString) => {
		const stage: SetupStage = parseInt(stageString);
		const stageData = stages[stage];

		Object.keys(stageData.elements || {}).forEach((inputName) => {
			const inputData = stageData.elements[inputName];
			const element = inputData.element;

			const value = getInputValue(element);
			if (value !== undefined) {
				config.stages[stage][inputName] = value;
			}
		});
	});

	return config;
}

function downloadCurrentConfig() {
	showConfigError('');
	const config = getCurrentConfig();

	// If the stage isn't high enough to generate points, display error
	if (getSetupStage() < SetupStage.GeneratePoints) {
		const shapeType = config.stages[SetupStage.ShapeSettings].shapeType;
		const error = `Please ${shapeType === 'custom' ? 'draw atleast three points' : 'select a shape type'} before downloading the config file`;
		showConfigError(error);
		return;
	}

	const configString = JSON.stringify(config);
	const configData = new Blob([configString], {type: 'application/json'});
	const configUrl = URL.createObjectURL(configData);

	const link = document.createElement('a');
	link.href = configUrl;
	link.download = 'config.json';
	link.click();
}

function loadConfig(config: SaveConfig) {
	showConfigError('');
	setSetupStage(0);

	switch (config.version) {
	case 1: loadConfigVersion1(config.stages); break;
	case 2: loadConfigVersion2(config.stages); break;
	default: throw new Error(`Unknown config version: ${config.version}`);
	}
}

function loadConfigVersion1(config: SaveConfig['stages']) {
	const vertexRules = config['2']?.vertexRules;
	if (vertexRules && Array.isArray(vertexRules)) {
		vertexRules?.forEach((rule, i) => {
			config['2'].vertexRules[i] = useSetEquator(rule);
		});
	}

	return loadConfigVersion2(config);
}

function loadConfigVersion2(config: SaveConfig['stages']) {
	Object.keys(config).forEach(async (stageString) => {
		const stage: SetupStage = parseInt(stageString);
		const stageData = stages[stage];
		if (!stageData) return;

		// Generate points before changing playback settings
		if (stage === SetupStage.Playback) await generatePoints();

		Object.keys(stageData.elements || {}).forEach((inputName) => {
			const inputData = stageData.elements[inputName];
			if (!inputData) return;

			setInputValue(inputData.element, config[stage][inputName] || inputData.sanitisation.default, true);
		});
	});
}

function onFileUpload() {
	const file = configUploadInput.files[0];
	const reader = new FileReader();
	reader.onload = () => {
		try {
			const result = reader.result;
			if (result instanceof ArrayBuffer) {
				throw new Error('File is encoded incorrectly');
			}

			const config = JSON.parse(result);
			loadConfig(config);
		} catch (error) {
			console.error(error.message);
			showConfigError(`Failed to load config file: ${error}`);
		}
	};
	reader.readAsText(file);
}

function showConfigError(message: string) {
	configError.innerText = message;
	configError.style.display = message === '' ? 'none' : 'block';
}

export function onload() {
	$('downloadConfigButton').addEventListener('click', downloadCurrentConfig);
	$('uploadConfigButton').addEventListener('click', () => configUploadInput.click());
	configUploadInput.addEventListener('change', onFileUpload);
}
