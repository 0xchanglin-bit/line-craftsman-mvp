import { initializeApp } from 'firebase/app';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

/**
 * 上傳檔案並回傳下載 URL
 * @param {File}     file         - 要上傳的 File 物件
 * @param {string}   path         - Storage 路徑，e.g. 'applications/userId/business_card.jpg'
 * @param {Function} onProgress   - 進度回調 (0–100)，可選
 * @returns {Promise<string>}     下載 URL
 */
export async function uploadFile(file, path, onProgress = null) {
  if (!file) return null;

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  if (file.size > MAX_SIZE) throw new Error('檔案大小超過 5MB 限制');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('僅支援 JPG / PNG 格式');

  const fileRef = storageRef(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      (error) => reject(new Error('檔案上傳失敗：' + error.message)),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
