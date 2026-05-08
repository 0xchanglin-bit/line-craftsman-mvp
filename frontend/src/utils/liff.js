import liff from '@line/liff';

let initialized = false;

export async function initLiff(liffId) {
  if (initialized) return;
  await liff.init({ liffId });
  initialized = true;
}

export function isInLiff() {
  return liff.isInClient();
}

export function isLoggedIn() {
  return liff.isLoggedIn();
}

export function loginWithLiff() {
  liff.login();
}

export function getIdToken() {
  return liff.getIDToken();
}

export async function getUserProfile() {
  return await liff.getProfile();
}

export function closeLiff() {
  if (isInLiff()) liff.closeWindow();
}
