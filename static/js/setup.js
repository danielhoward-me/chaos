const stageInputs = {
	2: {
		regularSideLength: {
			element: $('regularShapeSideLength'),
			defaultValue: 50,
		},
	},
};

const stageCount = 2;
let setupStage = 1;

function setSetupStage(stage) {
	for (let stageI = 1; stageI <= stageCount; stageI++) {
		const container = getSetupStageContainer(stageI);
		const enabled = stageI <= stage;
		setStageEnabled(container, enabled);
		
		// Reset stage if it is being disabled
		if (!enabled) {
			resetStageInputs(stageI);
		}
	}

	setupStage = stage;
}

function getSetupStageContainer(stage) {
	return document.querySelector(`[data-setup-stage="${stage}"]`);
}

function setStageEnabled(stageContainer, enabled) {
	stageContainer.querySelectorAll('input, select, button').forEach((input) => {
		input.disabled = !enabled;
	});

	const classFunction = enabled ? 'remove' : 'add';
	stageContainer.classList[classFunction]('text-muted');
	stageContainer.querySelectorAll('*').forEach((button) => {
		button.classList[classFunction]('text-muted');
	});
}

function resetStageInputs(stage) {
	const stageData = stageInputs[stage];
	if (!stageData) return;

	Object.values(stageData).forEach((inputData) => {
		inputData.element.value = inputData.defaultValue;
		inputData.element.dispatchEvent(new Event('input'));
	});
	stageData.onStageReset?.();
}

window.addEventListener('load', () => {
	setSetupStage(1);
});
