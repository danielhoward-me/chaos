import './styles/style.css';
import './styles/tag-input.css';

import './tag-input';

// The order here is important, otherwise it create circular dependencies
import {onload as canvasOnload} from './canvas/canvas';
import {onload as coreOnload} from './core';
import {onload as savesOnload} from './saves/saves';
import {onload as setupOnload} from './setup/setup';

window.addEventListener('DOMContentLoaded', () => {
	coreOnload();
	canvasOnload();
	savesOnload();
	setupOnload();
});
