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
const polygonSettings = $('polygonSettings');
const recordVerticesButton = $('recordVertices');
const recordVerticesText = $('recordVerticesText');
const shapeTypeText = $('shapeTypeText');

const polygonRotate = stages[2].elements.polygonRotate.element;
const regularSideLength = stages[2].elements.regularSideLength.element;
const polygonSideCount = stages[2].elements.polygonSideCount.element;
const pointsCount = stages[2].elements.pointsCount.element;
const lineProportion = stages[2].elements.lineProportion.element;

let listeningForVertices = false;

function setShapeSettingsViewable(isRegular) {
	let hideAll = isRegular === null;
	regularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'remove' : 'add')]('hidden');
	irregularShapeSettings.classList[hideAll ? 'add' : (isRegular ? 'add' : 'remove')]('hidden');
}

function setPolygonSettingsVisible(visible) {
	polygonSettings.classList[visible ? 'remove' : 'add']('hidden');
}

recordVerticesButton.addEventListener('click', () => {
	setRecordVerticesButtonActive(!listeningForVertices);
	if (!listeningForVertices && shapeVertices.length >= 3) {
		setSetupStage(3);
	}
});

canvas.addEventListener('click', (event) => {
	if (!listeningForVertices) return;

	const graphPoint = convertCanvasPointToGraphPoint([event.offsetX, event.offsetY]);
	addShapeVertices(graphPoint);
});

function setRecordVerticesButtonActive(active) {
	listeningForVertices = active;

	setGraphMovementDisabled(active, 'crosshair');

	recordVerticesText.innerText = active ? 'Stop' : 'Start';
	recordVerticesButton.classList[active ? 'add' : 'remove']('btn-danger');
	recordVerticesButton.classList[active ? 'remove' : 'add']('btn-success');
}
function clearRecordedShape() {
	clearShapeVertices();
	setSetupStage(2);
}

function generatePolygonVertices(sideLength, sideCount) {
	const {radius, internalMiddleAngle} = getShapeBaseData(sideLength, sideCount);

	let vertices = [];

	// Modify the angle to start at the top of the shape
	// and allow the shape to be rotated
	const userRotation = parseFloat(polygonRotate.value) * (Math.PI / 180);
	const defaultRotation = (defaultPolygonRotations[sideCount] || 0) * (Math.PI / 180);
	const angleModifier = (Math.PI / 2) - userRotation - defaultRotation;

	for (let sideI = 0; sideI < sideCount; sideI++) {
		const angle = (sideI * internalMiddleAngle) + angleModifier;
		vertices.push([
			radius * Math.cos(angle),
			radius * Math.sin(angle),
		]);
	}

	return vertices;
}

function getShapeBaseData(sideLength, sideCount) {
	const internalMiddleAngle = (2 * Math.PI) / sideCount; 
	const internalSideAngle = ((sideCount - 2) * Math.PI) / sideCount;
	const radius = (sideLength * Math.sin(internalSideAngle / 2)) / Math.sin(internalMiddleAngle);

	return {
		radius,
		internalMiddleAngle,
		internalSideAngle,
	};
}

function generatePolygonVerticesHandler() {
	const sideLength = parseFloat(regularSideLength.value);
	const sideCount = parseInt(polygonSideCount.value);

	clearShapeVertices();
	addShapeVertices(...generatePolygonVertices(sideLength, sideCount));

	const shapeType = polygonShapeNames[sideCount];
	shapeTypeText.innerText = shapeType ? `${shapeType?.charAt(0).toUpperCase()}${shapeType?.slice(1)} ` : '';
}

function shapeSettingsInputHandler(updateGraph) {
	if (!selectedShape) return;

	setSetupStage(3);
	sanitiseInputsInStage(2);

	if (updateGraph) {
		generatePolygonVerticesHandler();
	}
}

Object.values(stages[2].elements || []).forEach(({element}) => {
	element.addEventListener('input', () => shapeSettingsInputHandler(element.dataset.updateGraph !== undefined));
});
