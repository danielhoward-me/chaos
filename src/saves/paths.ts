const isDevelopment = process.env.NODE_ENV === 'development';
const searchParams = new URLSearchParams(window.location.search);

const ssoDevPort = searchParams.get('ssodevport');
const ssoOrigin = ssoDevPort === null ? 'https://sso.danielhoward.me' : `http://local.danielhoward.me:${ssoDevPort}`;
const ssoPath = `${ssoOrigin}/auth?target=chaos${isDevelopment ? '&devport=3001' : ''}`;

const backendDevPort = searchParams.get('backenddevport');
const backendOrigin = backendDevPort === null ? 'https://chaos-backend.danielhoward.me' : `http://local.danielhoward.me:${backendDevPort}`;

export {ssoPath, backendOrigin};
