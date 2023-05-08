const stageInputs = {
	1: {
		onStageReset: () => {
			setShapeSelected(null);
		},
	},
	2: {
		elements: {
			regularSideLength: {
				element: $('regularShapeSideLength'),
				defaultValue: 50,
			},
		},
		onStageReset: () => {
			setShapeSettingsViewable(null);
		},
	},
	3: {
		elements: {
			pointsCount: {
				element: $('pointsCount'),
				defaultValue: 1000,
			},
		},
	},
};

const stageCount = 3;
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
		if (element.tagName === 'BUTTON') return;
		element.classList[classFunction]('text-muted');
	});
}

function resetStageInputs(stage) {
	const stageData = stageInputs[stage];
	if (!stageData) return;

	Object.values(stageData.elements || []).forEach((inputData) => {
		inputData.element.value = inputData.defaultValue;
		inputData.element.dispatchEvent(new Event('input'));
	});
	stageData.onStageReset?.();
}

window.addEventListener('load', () => {
	setSetupStage(1);
});

// Stage 1 (shape type)
const regularShapes = [
	'triangle',
	'square',
	'pentagon',
	'hexagon',
];
const shapeTypes = Array.from(document.querySelectorAll('.type-selection .card'));

function setSingleShapeSelected(shapeType, selected) {
	const classFunction = selected ? 'add' : 'remove';
	shapeType.classList[classFunction]('text-white');
	shapeType.classList[classFunction]('bg-primary');
}

function setShapeSelected(shapeType) {
	shapeTypes.forEach((shape) => {
		setSingleShapeSelected(shape, shapeType === shape);
	});
}

document.querySelectorAll('.type-selection .card').forEach((type) => {
	type.addEventListener('click', () => {
		setShapeSelected(type);

		const shape = type.dataset.shapeType;
		setShapeSettingsViewable(regularShapes.includes(shape));

		setSetupStage(2);
	});
});

// Stage 2 (Shape Settings)
const regularShapeSettings = $('regularShapeSettings');
const irregularShapeSettings = $('irregularShapeSettings');

function setShapeSettingsViewable(isRegular) {
	let hideAll = isRegular === null;
	regularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'remove' : 'add')]('hidden');
	irregularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'add' : 'remove')]('hidden');
}
