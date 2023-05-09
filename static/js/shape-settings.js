const polygonShapeNames = {
	3: 'triangle',
	4: 'square',
	5: 'pentagon',
	6: 'hexagon',
	7: 'heptagon',
	8: 'octagon',
	9: 'nonagon',
	10: 'decagon',
	11: 'hendecagon',
	12: 'dodecagon',
	13: 'tridecagon',
	14: 'tetradecagon',
	15: 'pentadecagon',
	16: 'hexadecagon',
	17: 'heptadecagon',
	18: 'octadecagon',
	19: 'enneadecagon',
	20: 'icosagon',
};
const defaultPolygonRotations = {
	4: 45,
	6: 30,
};

const regularShapeSettings = $('regularShapeSettings');
const irregularShapeSettings = $('irregularShapeSettings');
const polygonSideCount = $('polygonSettings');
const recordPointsButton = $('recordPoints');
const recordPointsText = $('recordPointsText');
const shapeTypeText = $('shapeTypeText');

let listeningForPoints = false;

function setShapeSettingsViewable(isRegular) {
	let hideAll = isRegular === null;
	regularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'remove' : 'add')]('hidden');
	irregularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'add' : 'remove')]('hidden');
}

function setSideCountVisible(visible) {
	polygonSideCount.classList[visible ? 'remove' : 'add']('hidden');
}

recordPointsButton.addEventListener('click', () => {
	setRecordPointsButtonActive(!listeningForPoints);
	if (!listeningForPoints && shapePoints.length >= 3) {
		setSetupStage(3);
	}
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
	recordPointsButton.classList[active ? 'remove' : 'add']('btn-success');
}
function clearRecordedShape() {
	clearShapePoints();
	setSetupStage(2);
}

function generatePolygonPoints(sideLength, sideCount) {
	const internalMiddleAngle = (2 * Math.PI) / sideCount; 
	const internalSideAngle = ((sideCount - 2) * Math.PI) / sideCount;
	const radius = (sideLength * Math.sin(internalSideAngle / 2)) / Math.sin(internalMiddleAngle);

	let points = [];

	// Modify the angle to start at the top of the shape
	// and allow the shape to be rotated
	const userRotation = parseFloat(stages[2].elements.polygonRotate.element.value) * (Math.PI / 180);
	const defaultRotation = (defaultPolygonRotations[sideCount] || 0) * (Math.PI / 180);
	const angleModifier = (Math.PI / 2) - userRotation - defaultRotation;

	for (let sideI = 0; sideI < sideCount; sideI++) {
		const angle = (sideI * internalMiddleAngle) + angleModifier;
		points.push([
			radius * Math.cos(angle),
			radius * Math.sin(angle),
		]);
	}

	return points;
}

function generatePolygonPointsHandler() {
	const sideLength = parseFloat(stages[2].elements.regularSideLength.element.value);
	const sideCount = parseInt(stages[2].elements.polygonSideCount.element.value);

	clearShapePoints();
	addShapePoints(...generatePolygonPoints(sideLength, sideCount));

	const shapeType = polygonShapeNames[sideCount];
	shapeTypeText.innerText = shapeType ? `${shapeType?.charAt(0).toUpperCase()}${shapeType?.slice(1)} ` : '';
}

function shapeSettingsInputHandler(updateGraph) {
	if (!selectedShape) return;

	setSetupStage(3);
	sanitiseInputsInStage(2);

	if (updateGraph) {
		generatePolygonPointsHandler();
	}
}

Object.values(stages[2].elements || []).forEach(({element}) => {
	element.addEventListener('input', () => shapeSettingsInputHandler(element.dataset.updateGraph !== undefined));
});
