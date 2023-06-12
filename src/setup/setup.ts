import {SetupStage} from './../constants';
import {setInputValue} from './../core';
import TagInput from './../tag-input';
import {getStageData as getGeneratePointsStageData} from './generate-points';
import {getStageData as getPlaybackStageData} from './playback';
import {getStageData as getShapeSettingsStageData} from './shape-settings';
import {getStageData as getShapeTypeStageData} from './shape-type';

import type {SingleStageElementInput, StageData} from './../types.d';

export const stages: StageData = {
	[SetupStage.ShapeType]: getShapeTypeStageData(),
	[SetupStage.ShapeSettings]: getShapeSettingsStageData(),
	[SetupStage.GeneratePoints]: getGeneratePointsStageData(),
	[SetupStage.Playback]: getPlaybackStageData(),
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

	// 0 is the same as reseting everything
	// so we need to reenable the first stage
	if (newStage === 0) {
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

function resetStageInputs(stage: SetupStage) {
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
	setSetupStage(0);
}
