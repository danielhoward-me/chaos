import {onload as configOnload} from './config';
import {onload as localOnload} from './local';
import {onload as presetsOnload} from './presets';
import {onload as selectorOnload} from './selector';
import {onload as ssoOnload} from './sso';

export function onload() {
	configOnload();
	localOnload();
	presetsOnload();
	selectorOnload();
	ssoOnload();
}
