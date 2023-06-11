import './styles/style.css';
import './styles/tag-input.css';

import './tag-input';

import {onload as canvasOnload} from './canvas-utils/canvas';
import {onload as coreOnload} from './core';

window.addEventListener('DOMContentLoaded', () => {
	coreOnload();
	canvasOnload();
});
