const stages = {
	1: {
		onStageReset: () => {
			setShapeSelected(null);
		},
	},
	2: {
		elements: {
			regularSideLength: {
				element: $('regularShapeSideLength'),
				sanitisation: {
					isFloat: true,
					default: 50,
					mt: 0,
				},
			},
			polygonSideCount: {
				element: $('polygonSideCount'),
				sanitisation: {
					isInt: true,
					default: 5,
					mte: 3,
				},
			},
			polygonRotate: {
				element: $('polygonRotate'),
				sanitisation: {
					isFloat: true,
					default: 0,
					mte: 0,
					lte: 360,
				},
			},
			pointsCount: {
				element: $('pointsCount'),
				sanitisation: {
					isInt: true,
					default: 1000,
					mte: 1,
				},
			},
		},
		onStageReset: () => {
			setShapeSettingsViewable(null);
			setSideCountVisible(false);
			clearShapePoints();
		},
		onStageExit: () => {
			setRecordPointsButtonActive(false);
		},
	},
};

const stageCount = 4;
let setupStage = 1;

let shapePoints = [];
const shapePointsAssetId = 'shapePoints';
function addShapePoints(...points) {
	shapePoints.push(...points);
	removeAsset(shapePointsAssetId);
	addAsset({
		id: shapePointsAssetId,
		type: 'polygon',
		points: shapePoints,
		stroke: true,
		lineWidth: 2,
	});
}
function clearShapePoints() {
	shapePoints = [];
	removeAsset(shapePointsAssetId);
}

function setSetupStage(stage) {
	if (stage === setupStage) return;

	stages[setupStage]?.onStageExit?.();

	for (let stageI = 1; stageI <= stageCount; stageI++) {
		const container = getSetupStageContainer(stageI);
		const enabled = stageI <= stage;
		setStageEnabled(container, enabled);
		
		// Reset stage if it is being disabled
		if (!enabled) {
			resetStageInputs(stageI);
		}
	}

	// 0 is the same as reseting everything
	// so we need to reenable the first stage
	if (stage === 0) {
		const container = getSetupStageContainer(1);
		setStageEnabled(container, true);
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
	stageContainer.querySelectorAll('*').forEach((element) => {
		if ((['BUTTON', 'I']).includes(element.tagName)) return;
		element.classList[classFunction]('text-muted');
	});
}

function resetStageInputs(stage) {
	const stageData = stages[stage];
	if (!stageData) return;

	Object.values(stageData.elements || []).forEach((inputData) => {
		inputData.element.setValue(inputData?.sanitisation?.default);
	});
	stageData.onStageReset?.();
}

window.addEventListener('load', () => {
	setSetupStage(0);
});

function sanitiseInputsInStage(stage) {
	const stageData = stages[stage];
	if (!stageData) return;

	Object.values(stageData.elements || []).forEach(({element, sanitisation}) => {
		const originalValue = element.value;
		let newValue = originalValue;

		if (sanitisation.isInt) newValue = parseInt(newValue);
		if (sanitisation.isFloat) newValue = parseFloat(newValue);

		if (sanitisation.mt !== undefined && !(newValue > sanitisation.mt)) newValue = sanitisation.default;
		if (sanitisation.mte !== undefined && !(newValue >= sanitisation.mte)) newValue = sanitisation.default;
		if (sanitisation.lt !== undefined && !(newValue < sanitisation.lt)) newValue = sanitisation.default;
		if (sanitisation.lte !== undefined && !(newValue <= sanitisation.lte)) newValue = sanitisation.default;

		if (isNaN(newValue)) newValue = sanitisation.default;

		// Don't compare type as it could be a string and number
		element.setValue(newValue, newValue != originalValue);
	});
}
