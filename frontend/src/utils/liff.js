// Uses window.liff loaded via CDN script tag in index.html

let initialized = false;

function getLiff() {
  if (!window.liff) throw new Error('LIFF SDK not loaded');
  return window.liff;
}

export async function initLiff(liffId) {
  if (initialized) return;
  await getLiff().init({ liffId, withLoginOnIssuedAccessToken: true });
  initialized = true;
}

export function isInLiff() {
  return getLiff().isInClient();
}

export function isLoggedIn() {
  return getLiff().isLoggedIn();
}

export function loginWithLiff() {
  getLiff().login();
}

export function getIdToken() {
  return getLiff().getIDToken();
}

export async function getUserProfile() {
  return await getLiff().getProfile();
}

export function closeLiff() {
  if (isInLiff()) getLiff().closeWindow();
}
