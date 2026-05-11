// Uses window.liff loaded via CDN script tag in index.html

let initialized = false;

function getLiff() {
  if (!window.liff) {
    console.error('[liff.js] LIFF SDK 未載入');
    throw new Error('LIFF SDK not loaded');
  }
  return window.liff;
}

export async function initLiff(liffId) {
  if (initialized) {
    console.log('[liff.js] 已經初始化過了');
    return;
  }

  console.log('[liff.js] 初始化 LIFF，ID:', liffId);

  await getLiff().init({
    liffId,
    withLoginOnIssuedAccessToken: true,
  });

  initialized = true;
  console.log('[liff.js] 初始化完成');
}

export function isInLiff() {
  const inClient = getLiff().isInClient();
  console.log('[liff.js] 是否在 LINE 中:', inClient);
  return inClient;
}

export function isLoggedIn() {
  const loggedIn = getLiff().isLoggedIn();
  console.log('[liff.js] 登入狀態:', loggedIn);
  return loggedIn;
}

export function loginWithLiff() {
  console.log('[liff.js] 執行登入');
  getLiff().login();
}

export function getIdToken() {
  const token = getLiff().getIDToken();
  console.log('[liff.js] ID Token:', token ? '已取得' : 'null');
  return token;
}

export async function getUserProfile() {
  console.log('[liff.js] 獲取用戶資料');
  const profile = await getLiff().getProfile();
  console.log('[liff.js] 用戶資料:', profile);
  return profile;
}

export function closeLiff() {
  if (isInLiff()) {
    console.log('[liff.js] 關閉 LIFF 視窗');
    getLiff().closeWindow();
  }
}
