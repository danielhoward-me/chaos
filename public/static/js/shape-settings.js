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

const regularShapeSettings = $('regularShapeSettings');
const irregularShapeSettings = $('irregularShapeSettings');
const polygonSettings = $('polygonSettings');
const recordVerticesButton = $('recordVertices');
const recordVerticesText = $('recordVerticesText');
const shapeTypeText = $('shapeTypeText');
const vertexRuleFeedback = $('vertexRuleFeedback');

const polygonRotate = stages[2].elements.polygonRotate.element;
const regularSideLength = stages[2].elements.regularSideLength.element;
const polygonSideCount = stages[2].elements.polygonSideCount.element;
const pointsCount = stages[2].elements.pointsCount.element;
const lineProportion = stages[2].elements.lineProportion.element;
const vertexRules = stages[2].elements.vertexRules.element;

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
	// Rotate even sided shapes by half the internal angle to make them point up
	const defaultRotation = sideCount % 2 === 0 ? internalMiddleAngle / 2 : 0;
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

const characterSets = {
	'≠': ['!', '='],
	'≤': ['<', '='],
	'≥': ['>', '='],
};
const characterSetEntries = Object.entries(characterSets).map(([replacement, characters]) => [replacement, characters.sort()]);
vertexRules.addEventListener('input', () => {
	const value = vertexRules.input.value;

	for (let i = 0; i < value.length; i++) {
		characterSetEntries.forEach(([replacement, characters]) => {
			if (i + characters.length > value.length) return;

			const valueCharacters = [];
			for (let j = 0; j < characters.length; j++) {
				valueCharacters.push(value[i + j]);
			}
			valueCharacters.sort();

			if (valueCharacters.join('') === characters.join('')) {
				vertexRules.input.value = value.slice(0, i) + replacement + value.slice(i + characters.length);
			}
		});
	}
});

vertexRules.addEventListener('newtag', (e) => {
	vertexRules.parentElement.classList.remove('is-invalid');
	vertexRuleFeedback.classList.add('hidden');

	const tag = e.detail.tag;

	try {
		new VertexRule(tag);
	} catch (err) {
		e.preventDefault();

		vertexRules.parentElement.classList.add('is-invalid');
		vertexRuleFeedback.innerText = err.message;
		vertexRuleFeedback.classList.remove('hidden');
	}
});

Object.values(stages[2].elements || []).forEach(({element}) => {
	element.addEventListener('input', () => shapeSettingsInputHandler(element.dataset.updateGraph !== undefined));
});
