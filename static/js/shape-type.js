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
const shapes = Array.from(document.querySelectorAll('.type-selection .card'));
let selectedShape = null;

function setSingleShapeSelected(shape, selected) {
	const classFunction = selected ? 'add' : 'remove';
	shape.classList[classFunction]('text-white');
	shape.classList[classFunction]('bg-primary');
	shape.querySelector('img').classList[classFunction]('shape-image-selected');
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
		const isCustomShape = shapeType === 'custom';
		const isPreset = Object.values(polygonShapeNames).includes(shapeType);

		setShapeSelected(shape);
		setShapeSettingsViewable(!isCustomShape);
		setSideCountVisible(!(isCustomShape || isPreset));
		clearShapePoints();

		if (isCustomShape) {
			setSetupStage(2);
		} else {
			if (Object.values(polygonShapeNames).includes(shapeType)) {
				const sideCount = Object.keys(polygonShapeNames).find((key) => polygonShapeNames[key] === shapeType);
				stageInputs[2].elements.polygonSideCount.element.value = sideCount;
			}

			// Trigger input event to update shape
			shapeSettingsInputHandler(true);
		}
	});
});
