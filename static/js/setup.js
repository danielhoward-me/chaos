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
			clearShapePoints();
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
	});
}
function clearShapePoints() {
	shapePoints = [];
	removeAsset(shapePointsAssetId);
}

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
		if ((['BUTTON', 'I']).includes(element.tagName)) return;
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
const regularShapeHandlers = {
	'triangle': (sideLength) => {
		const shapeHeight = sideLength * Math.cos(Math.PI / 6);
		const belowY = (sideLength * Math.tan(Math.PI / 6)) / 2;
		const xOffset = sideLength / 2;
		const yOffset = (shapeHeight / 2) - belowY;
		addShapePoints(
			[0, (shapeHeight - belowY) - yOffset],
			[xOffset, -belowY - yOffset],
			[-xOffset, -belowY - yOffset],
		);
	},
	'square': (sideLength) => {
		
	},
	'pentagon': (sideLength) => {
		
	},
	'hexagon': (sideLength) => {
		
	},
};
const shapes = Array.from(document.querySelectorAll('.type-selection .card'));
const shapeTypeText = $('shapeTypeText');
let selectedShape = null;

function setSingleShapeSelected(shape, selected) {
	const classFunction = selected ? 'add' : 'remove';
	shape.classList[classFunction]('text-white');
	shape.classList[classFunction]('bg-primary');

	if (selected) {
		const shapeType = shape.dataset.shapeType;
		shapeTypeText.innerText = shapeType[0].toUpperCase() + shapeType.slice(1);
	}
}

function setShapeSelected(shape) {
	selectedShape = shape?.dataset.shapeType || null;
	shapes.forEach((shapeCard) => {
		setSingleShapeSelected(shapeCard, shape === shapeCard);
	});
}

shapes.forEach((shape) => {
	shape.addEventListener('click', () => {
		const shapeType = shape.dataset.shapeType;
		if (shapeType === selectedShape) return;
		const regularShape = shapeType in regularShapeHandlers;

		setShapeSelected(shape);
		setRecordPointsButtonActive(false);
		setShapeSettingsViewable(regularShape);
		clearShapePoints();
		setSetupStage(2);

		if (regularShape) {
			stageInputs[2].elements.regularSideLength.element.dispatchEvent(new Event('input'));
		}
	});
});

stageInputs[2].elements.regularSideLength.element.addEventListener('input', function() {
	if (!selectedShape) return;
	clearShapePoints();
	regularShapeHandlers[selectedShape](this.value);
});

// Stage 2 (Shape Settings)
const regularShapeSettings = $('regularShapeSettings');
const irregularShapeSettings = $('irregularShapeSettings');
const recordPointsButton = $('recordPoints');
const recordPointsText = $('recordPointsText');

let listeningForPoints = false;

function setShapeSettingsViewable(isRegular) {
	let hideAll = isRegular === null;
	regularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'remove' : 'add')]('hidden');
	irregularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'add' : 'remove')]('hidden');
}

recordPointsButton.addEventListener('click', () => {
	setRecordPointsButtonActive(!listeningForPoints);
});

canvas.addEventListener('click', (event) => {
	if (!listeningForPoints) return;

	const graphPoint = convertCanvasPointToGraphPoint([event.offsetX, event.offsetY]);
	addShapePoints(graphPoint);
});

function setRecordPointsButtonActive(active) {
	listeningForPoints = active;

	setGraphMovementDisabled(active, 'crosshair');

	recordPointsText.innerText = active ? 'Stop' : 'Start';
	recordPointsButton.classList[active ? 'add' : 'remove']('btn-danger');
	recordPointsButton.classList[active ? 'remove' : 'add']('btn-primary');
}
