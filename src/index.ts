import './styles/style.css';
import './styles/tag-input.css';

import './tag-input';

import {onload as canvasOnload} from './canvas/canvas';
import {onload as coreOnload} from './core';
import {onload as savesOnload} from './saves';
import {onload as setupOnload} from './setup/setup';

window.addEventListener('DOMContentLoaded', () => {
	console.log(234);
	coreOnload();
	setupOnload();
	canvasOnload();
	savesOnload();
});
