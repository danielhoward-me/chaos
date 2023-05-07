const $ = (id) => document.getElementById(id);

/** @type {HTMLCanvasElement} */
const canvas = $('canvas');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
