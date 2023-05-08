const $ = (id) => document.getElementById(id);

/** @type {HTMLCanvasElement} */
const canvas = $('canvas');
/** @type {HTMLDivElement} */
const settingsBox = $('settingsBox');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function toggleSettings() {
	const isHidden = settingsBox.classList.toggle('closed');
	if (canvas.width <= 768) {
		topLeftPoint[1] += canvas.height/4 * (isHidden ? 1 : -1);
	} else {
		topLeftPoint[0] += 215 * (isHidden ? 1 : -1);
	}
}

function updateInputWithRange(thisInput, otherInputId, isRange) {
	const otherInput = $(otherInputId);
	otherInput.value = thisInput.value;
	if (isRange) otherInput.dispatchEvent(new Event('input'));
}
