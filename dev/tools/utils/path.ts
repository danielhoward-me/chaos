import path from 'path';
import {fileURLToPath} from 'url';

export const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function resolvePath(pathToResolve: string): string {
	return path.resolve(__dirname, '..', pathToResolve);
}
