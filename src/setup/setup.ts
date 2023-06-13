import {SetupStage} from './../constants';
import {setInputValue, $} from './../core';
import TagInput from './../tag-input';
import {stageData as generatePointsStageData, onload as generatePointsOnload} from './generate-points';
import {stageData as playbackStageData, onload as playbackOnload} from './playback';
import {stageData as shapeSettingsStageData, onload as shapeSettingsOnload} from './shape-settings';
import {stageData as shapeTypeStageData, onload as shapeTypeOnload} from './shape-type';

import type {SingleStageElementInput, StageData} from './../types.d';

export const stages: StageData = {
	[SetupStage.Reset]: {},
	[SetupStage.ShapeType]: shapeTypeStageData,
	[SetupStage.ShapeSettings]: shapeSettingsStageData,
	[SetupStage.GeneratePoints]: generatePointsStageData,
	[SetupStage.Playback]: playbackStageData,
};

let setupStage: SetupStage = SetupStage.ShapeType;

export function getSetupStage(): SetupStage {
	return setupStage;
}

export function setSetupStage(newStage: SetupStage) {
	if (newStage === setupStage) return;

	stages[setupStage]?.onStageExit?.();

	Object.keys(stages).forEach((stageString) => {
		const stage: SetupStage = parseInt(stageString);

		const container = getSetupStageContainer(stage);
		const enabled = stage <= newStage;
		setStageEnabled(container, enabled);

		// Reset stage if it is being disabled
		if (!enabled) {
			resetStageInputs(stage);
		}
	});

	// Reset is the same as reseting everything
	// so we need to reenable the first stage
	if (newStage === SetupStage.Reset) {
		newStage = SetupStage.ShapeType;
		const container = getSetupStageContainer(newStage);
		setStageEnabled(container, true);
	}

	setupStage = newStage;
}

function getSetupStageContainer(stage: SetupStage): HTMLDivElement {
	return document.querySelector(`[data-setup-stage="${stage}"]`);
}

function setStageEnabled(stageContainer: HTMLDivElement, enabled: boolean) {
	stageContainer.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button').forEach((input) => {
		input.disabled = !enabled;
	});

	// Add text-muted class to every element in the stage
	// this is aggresive but ensures correct output
	const classFunction = enabled ? 'remove' : 'add';
	stageContainer.classList[classFunction]('text-muted');
	stageContainer.querySelectorAll('*').forEach((element) => {
		if ((['BUTTON', 'I']).includes(element.tagName)) return;
		element.classList[classFunction]('text-muted');
	});
}

export function resetStageInputs(stage: SetupStage) {
	const stageData = stages[stage];
	if (!stageData) return;

	Object.values(stageData.elements || []).forEach((inputData) => {
		// Clone default value to stop issues with pointers
		const defaultValue = JSON.parse(JSON.stringify(inputData?.sanitisation?.default));
		setInputValue(inputData.element, defaultValue, true);
	});
	stageData.onStageReset?.();
}

export function sanitiseInputsInStage(stage: SetupStage) {
	const stageData = stages[stage];
	if (!stageData) return;

	Object.values(stageData.elements || []).forEach((inputData) => {
		if (inputData.element instanceof TagInput) return;

		const {element, sanitisation} = <SingleStageElementInput> inputData;
		if (element.type !== 'number') return;

		const originalValue = element.value;
		let newValue: number;

		if (sanitisation.isInt) newValue = parseInt(originalValue);
		if (sanitisation.isFloat) newValue = parseFloat(originalValue);

		const defaultValue = <number> sanitisation.default;

		if (sanitisation.mt !== undefined && !(newValue > sanitisation.mt)) newValue = defaultValue;
		if (sanitisation.mte !== undefined && !(newValue >= sanitisation.mte)) newValue = defaultValue;
		if (sanitisation.lt !== undefined && !(newValue < sanitisation.lt)) newValue = defaultValue;
		if (sanitisation.lte !== undefined && !(newValue <= sanitisation.lte)) newValue = defaultValue;

		if (isNaN(newValue)) newValue = defaultValue;

		// Don't compare type as it could be a string and number
		setInputValue(element, newValue, newValue.toString() !== originalValue);
	});
}

export function onload() {
	console.log(234);
	shapeTypeOnload();
	shapeSettingsOnload();
	generatePointsOnload();
	console.log(234);
	playbackOnload();

	setSetupStage(0);
	$('resetButton').addEventListener('click', () => setSetupStage(SetupStage.Reset));
}
