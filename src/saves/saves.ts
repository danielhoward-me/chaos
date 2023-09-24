import {onload as configOnload} from './config';
import {onload as selectorOnload} from './selector';
import {onload as ssoOnload} from './sso';

export function onload() {
	configOnload();
	selectorOnload();
	ssoOnload();
}
