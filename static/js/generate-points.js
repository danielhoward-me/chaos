const generatePointsButton = $('generatePoints');
const loadingBar = $('generatePointsLoadingBar');
const loadingBarBody = loadingBar.querySelector('div');
let currentResolve;

const worker = new Worker('/static/js/generate-points-worker.js');
worker.onmessage = function(e) {
	const {
		type,
		data,
	} = e.data;

	switch (type) {
	case 'points':
		currentResolve(data);
		currentResolve = null;
		break;
	case 'loadingProgress':
		showLoadingProgress(data);
		break;
	}
}

function generateSierpinskiPoints(vertices, pointsCount) {
	if (currentResolve) return Promise.reject('Already generating points');
	return new Promise((resolve) => {
		const startPoint = getRandomPointInShape(...vertices);

		worker.postMessage({
			vertices,
			startPoint,
			pointsCount,
		});

		currentResolve = resolve;
	});
}
generatePointsButton.addEventListener('click', async () => {
	loadingBar.classList.remove('hidden');

	const pointsCount = stages[2].elements.pointsCount.element.value;
	const points = await generateSierpinskiPoints(shapeVertices, pointsCount);
	setSierpinskiPoints(points);

	loadingBar.classList.add('hidden');
});

function showLoadingProgress(progess) {
	loadingBarBody.style.width = `${progess}%`;
	loadingBarBody.innerText = `${progess}%`;
}
