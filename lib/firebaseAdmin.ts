import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

// Import service account credentials
import serviceAccount from '../comedy-app-16e56-firebase-adminsdk-fbsvc-c6f72faecc.json';

// 检查是否已经初始化
const apps = getApps();

if (!apps.length) {
  try {
    initializeApp({
      credential: cert(serviceAccount as any),
      storageBucket: "comedy-app-16e56.firebasestorage.app"  // 更新为正确的存储桶名称
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

// 导出需要的 Firebase Admin 服务
export const adminStorage = getStorage();
export const adminDb = getFirestore(); 