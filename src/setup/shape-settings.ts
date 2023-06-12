import {$} from './../core';

import type TagInput from './../tag-input';
import type {SingleStageData} from './../types.d';

export function getStageData(): SingleStageData {
	return {
		elements: {
			regularSideLength: {
				element: $<HTMLInputElement>('regularShapeSideLength'),
				sanitisation: {
					isFloat: true,
					default: 50,
					mt: 0,
				},
			},
			polygonSideCount: {
				element: $<HTMLInputElement>('polygonSideCount'),
				sanitisation: {
					isInt: true,
					default: 5,
					mte: 3,
				},
			},
			polygonRotate: {
				element: $<HTMLInputElement>('polygonRotate'),
				sanitisation: {
					isFloat: true,
					default: 0,
					mte: 0,
					lte: 360,
				},
			},
			pointsCount: {
				element: $<HTMLInputElement>('pointsCount'),
				sanitisation: {
					isInt: true,
					default: 1000,
					mte: 1,
				},
			},
			lineProportion: {
				element: $<HTMLInputElement>('lineProportion'),
				sanitisation: {
					isFloat: true,
					default: 50,
					mte: 0,
					lte: 100,
				},
			},
			vertexRules: {
				element: $<TagInput>('vertexRules'),
				sanitisation: {
					default: [],
				},
			},
			shapeVertices: {
				element: $<HTMLInputElement>('shapeVertices'),
				sanitisation: {
					default: '',
				},
			},
		},
		onStageReset: () => {
			setShapeSettingsViewable(null);
			setPolygonSettingsVisible(false);
			clearShapeVertices();
			setVertexRulesDetailsDisabled(false);
			setVertexRulesDetailsOpen(false);
		},
		onStageExit: () => {
			setRecordVerticesButtonActive(false);
		},
	};
}

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
const vertexRulesFeedback = $('vertexRulesFeedback');
const vertexRulesDetails = $('vertexRulesDetails');
const vertexRulesDetailsSummary = vertexRulesDetails.querySelector('summary');

const polygonRotate = stages[2].elements.polygonRotate.element;
const regularSideLength = stages[2].elements.regularSideLength.element;
const polygonSideCount = stages[2].elements.polygonSideCount.element;
const pointsCount = stages[2].elements.pointsCount.element;
const lineProportion = stages[2].elements.lineProportion.element;
const vertexRules = stages[2].elements.vertexRules.element;
const shapeVerticesInput = stages[2].elements.shapeVertices.element;

let listeningForVertices = false;

let shapeVertices = [];
const shapeVerticesAssetId = 'shapeVertices';
function addShapeVertices(...vertices) {
	shapeVertices.push(...vertices);
	removeAsset(shapeVerticesAssetId);
	addAssets({
		id: shapeVerticesAssetId,
		type: 'polygon',
		points: shapeVertices,
		stroke: true,
		lineWidth: 2,
	});
	shapeVerticesInput.value = shapeVertices.map((vertex) => vertex.join(',')).join(' ');
}
function clearShapeVertices() {
	shapeVertices = [];
	removeAsset(shapeVerticesAssetId);
	shapeVerticesInput.value = '';
}

shapeVerticesInput.addEventListener('input', () => {
	const value = shapeVerticesInput.value.trim();
	if (!value) return;

	clearShapeVertices();
	const vertices = value.split(' ').map((vertex) => vertex.split(',').map((value) => parseFloat(value)));
	addShapeVertices(...vertices);
});

function setShapeSettingsViewable(isRegular) {
	const hideAll = isRegular === null;
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

	const vertices = [];

	// Modify the angle to start at the top of the shape
	// and allow the shape to be rotated
	const userRotation = parseFloat(polygonRotate.value) * (Math.PI / 180);
	// Rotate even sided shapes by half the internal angle to make them point up
	const defaultRotation = sideCount % 2 === 0 ? internalMiddleAngle / 2 : 0;
	const angleModifier = (Math.PI / 2) - userRotation - defaultRotation;

	for (let sideI = 0; sideI < sideCount; sideI++) {
		const angle = -(sideI * internalMiddleAngle) + angleModifier;
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

	if (!(shapeTypeSelect.value === 'custom' && shapeVertices.length < 3)) {
		setSetupStage(3);
	}

	sanitiseInputsInStage(2);

	if (updateGraph) {
		generatePolygonVerticesHandler();
	}
}

function getArrayPermutations(arr) {
	const combinations = arr.length <= 2 ? (
		[arr.join(''), arr.reverse().join('')]
	) : arr.reduce(
		(acc, letter, i) => acc.concat(getArrayPermutations(arr.slice(0, i).concat(arr.slice(i + 1))).map((val) => letter + val)),
		[],
	);

	return Array.from(new Set(combinations));
}
const characterSets = {
	'≠': ['!', '='],
	'≤': ['<', '='],
	'≥': ['>', '='],
	'∈': ['in'],
	'∉': ['!', '∈'],
	'±': ['+', '-'],
};
const characterSetEntries = Object.entries(characterSets).map(([replacement, characters]) => [replacement, getArrayPermutations(characters)]);
vertexRules.addEventListener('input', () => {
	vertexRules.parentElement.classList.remove('is-invalid');
	vertexRulesFeedback.classList.add('hidden');

	let origionalSelectionStart = vertexRules.input.selectionStart;
	let value = vertexRules.input.value;

	characterSetEntries.forEach(([replacement, characterCombinations]) => {
		characterCombinations.forEach((characters) => {
			while (value.includes(characters)) {
				if (value.indexOf(characters) < origionalSelectionStart) {
					origionalSelectionStart -= characters.length - 1;
				}

				value = value.replace(characters, replacement);
			}
		});
	});

	vertexRules.input.value = value.toLowerCase();
	vertexRules.input.setSelectionRange(origionalSelectionStart, origionalSelectionStart);
});

function setVertexRulesDetailsDisabled(disabled) {
	vertexRulesDetails.toggleAttribute('disabled', disabled);
	vertexRulesDetailsSummary[disabled ? 'setAttribute' : 'removeAttribute']('tabindex', '-1');
}
function setVertexRulesDetailsOpen(open) {
	vertexRulesDetails.toggleAttribute('open', open);
}

vertexRules.addEventListener('newtag', (e) => {
	const tag = e.detail.tag;

	try {
		const rule = new VertexRule(tag);
		e.detail.changeTag(rule.formatRule());
	} catch (err) {
		e.preventDefault();
		console.error(err);

		vertexRules.parentElement.classList.add('is-invalid');
		vertexRulesFeedback.innerText = err.message;
		vertexRulesFeedback.classList.remove('hidden');
	}

	setVertexRulesDetailsDisabled(true);
	setVertexRulesDetailsOpen(true);
});

vertexRules.addEventListener('removetag', () => {
	if (vertexRules.tags.length === 0) {
		setVertexRulesDetailsDisabled(false);
	}

	setSetupStage(3);
});

// Triggered when the value is set directly
vertexRules.addEventListener('tagschanged', () => {
	const rulesInUse = vertexRules.tags.length !== 0;
	setVertexRulesDetailsDisabled(rulesInUse);
	setVertexRulesDetailsOpen(rulesInUse);
});

Object.values(stages[2].elements || []).forEach(({element}) => {
	element.addEventListener('input', () => shapeSettingsInputHandler(element.dataset.updateGraph !== undefined));
});
