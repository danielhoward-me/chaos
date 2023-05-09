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
	const angleModifier = (Math.PI / 2) - (parseFloat(stageInputs[2].elements.polygonRotate.element.value) * (Math.PI / 180));

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
	const sideLength = parseFloat(stageInputs[2].elements.regularSideLength.element.value);
	const sideCount = parseInt(stageInputs[2].elements.polygonSideCount.element.value);

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

Object.values(stageInputs[2].elements || []).forEach(({element}) => {
	element.addEventListener('input', () => shapeSettingsInputHandler(element.dataset.updateGraph !== undefined));
});
