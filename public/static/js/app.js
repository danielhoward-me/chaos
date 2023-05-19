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
		topLeftPoint[1] += (canvas.height/4 * (isHidden ? 1 : -1)) * scale;
	} else {
		topLeftPoint[0] += (215 * (isHidden ? 1 : -1)) * scale;
	}
}

function updateInputWithRange(thisInput, otherInputId, isRange) {
	const otherInput = $(otherInputId);
	otherInput.value = thisInput.value;
	if (isRange) otherInput.dispatchEvent(new Event('input'));
}

// Allows us to set a value, and trigger the input event
HTMLInputElement.prototype.setValue = function(value, triggerEvent = true) {
	switch (this.type) {
	case 'checkbox':
		this.checked = value;
		break;
	default:
		this.value = value;
		break;
	}

	if (triggerEvent) this.dispatchEvent(new Event('input'));
}
HTMLSelectElement.prototype.setValue = function(value, triggerEvent = true) {
	this.value = value;
	if (triggerEvent) this.dispatchEvent(new Event('change'));
}

// Allows to get a value from an input, based on its type
HTMLInputElement.prototype.getValue = function() {
	switch (this.type) {
	case 'checkbox':
		return this.checked;
	default:
		return this.value;
	}
}
HTMLSelectElement.prototype.getValue = function(value, triggerEvent = true) {
	return this.value;
}

// Allows us to complete operations on all items in a NodeList
NodeList.prototype.setValue = function(key, value) {
	this.forEach((element) => {
		element[key] = value;
	});
}

const helpBox = $('helpBox');

function toggleHelp(force = undefined) {
	const isHidden = helpBox.classList.toggle('closed', force === undefined ? undefined : !force);
	const newHash = isHidden ? '' : window.location.hash.startsWith('#help') ? window.location.hash : '#help';
	window.history.pushState(null, null, window.location.pathname + newHash);
}
function readHelpHash() {
	const hash = window.location.hash;
	const isHelp = hash.startsWith('#help');
	toggleHelp(isHelp);
	if (!isHelp) return;

	const helpSection = hash.split('#')[1];
	const sectionElement = document.querySelector(`[data-help-section="${helpSection}"]`);
	if (sectionElement) {
		sectionElement.scrollIntoView({behavior: 'smooth'});
	}
}
window.addEventListener('load', readHelpHash);
window.addEventListener('hashchange', readHelpHash);
document.querySelectorAll('a[href^="#help-"]').forEach((element) => {
	element.addEventListener('click', readHelpHash);
});

function zoomIn() {
	handleZoom(getCurrentScreenCenter(), -100);
}
function zoomOut() {
	handleZoom(getCurrentScreenCenter(), 100);
}
function getCurrentScreenCenter() {
	center = [canvas.width/2, canvas.height/2];

	if (settingsBox.classList.contains('closed')) {
		return center;
	}

	if (canvas.width <= 768) {
		center[1] /= 2;
	} else {
		center[0] += 215;
	}

	return center;
}
