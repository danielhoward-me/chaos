import {SetupStage} from './../constants';
import {getInputValue, setInputValue} from './../core';
import {generatePoints} from './../setup/generate-points';
import {getStages, setSetupStage} from './../setup/setup';
import {useSetEquator} from './../vertex-rule';

import type {SaveConfig} from './../types.d';

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

export function getCurrentConfig(): SaveConfig {
	const config: SaveConfig = {
		version: CURRENT_SAVE_VERSION,
		stages: {
			[SetupStage.ShapeType]: {},
			[SetupStage.ShapeSettings]: {},
			[SetupStage.GeneratePoints]: {},
			[SetupStage.Playback]: {},
		},
	};

	const stages = getStages();
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

export function loadConfig(config: SaveConfig) {
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
	const stages = getStages();
	Object.keys(config).forEach(async (stageString) => {
		const stage: SetupStage = parseInt(stageString);
		const stageData = stages[stage];
		if (!stageData) return;

		Object.keys(stageData.elements || {}).forEach((inputName) => {
			const inputData = stageData.elements[inputName];
			if (!inputData) return;

			setInputValue(inputData.element, config[stage][inputName] || inputData.sanitisation.default, true);
		});

		// Generate points before changing playback settings
		// This needs to be done after the input values have been set
		if (stage === SetupStage.Playback) await generatePoints();
	});
}
