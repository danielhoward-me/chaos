import {onload as localOnload} from './local';
import {onload as presetsOnload} from './presets';
import {onload as saveOnload} from './save';
import {onload as selectorOnload} from './selector';
import {onload as ssoOnload} from './sso';

export function onload() {
	localOnload();
	presetsOnload();
	saveOnload();
	selectorOnload();
	ssoOnload();
}
