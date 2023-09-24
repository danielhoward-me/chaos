const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const success = document.getElementById('success');

function saveAccessToken() {
	const ssoParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
	window.history.pushState(null, null, window.location.pathname);

	const accessToken = ssoParams.get('access_token');
	const expiresIn = ssoParams.get('expires_in');

	let errorText = '';
	if (!accessToken || !expiresIn) {
		errorText = 'Both access_token and expires_in are required in the hash';
	} else if (!Number.isInteger(parseInt(expiresIn))) {
		errorText = 'expires_in should be an int';
	}
	if (errorText !== '') {
		console.error(errorText);
		loadingSpinner.classList.add('hidden');
		errorAlert.innerHTML += errorText;
		errorAlert.classList.remove('hidden');
		return;
	}

	const expires = Date.now() + parseInt(expiresIn) * 1000;

	localStorage.setItem('auth', JSON.stringify({accessToken, expires}));

	loadingSpinner.classList.add('hidden');
	success.classList.remove('hidden');

	if (!window.opener) window.location.href = '/';
}

saveAccessToken();
