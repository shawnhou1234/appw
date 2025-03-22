import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminStorage } from '../../lib/firebaseAdmin';

interface FirestoreResult {
  success: boolean;
  error?: string | null;
  exists?: boolean;
  data?: any;
}

interface StorageResult {
  success: boolean;
  error?: string | null;
  fileExists?: boolean;
  filesCount?: number;
}

interface TestResults {
  firestore: FirestoreResult;
  storage: StorageResult;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允许 GET 请求' });
  }

  const results: TestResults = {
    firestore: { success: false, error: null },
    storage: { success: false, error: null }
  };

  try {
    // 测试 Firestore 访问
    try {
      const testCollection = adminDb.collection('test');
      // 尝试写入一个测试文档
      await testCollection.doc('test-doc').set({
        test: true,
        timestamp: new Date()
      });
      // 然后读取它
      const testDoc = await testCollection.doc('test-doc').get();
      results.firestore = {
        success: true,
        exists: testDoc.exists,
        data: testDoc.data()
      };
    } catch (firestoreError) {
      results.firestore = {
        success: false,
        error: firestoreError instanceof Error ? firestoreError.message : '未知错误'
      };
    }

    // 测试 Storage 访问
    try {
      const bucket = adminStorage.bucket();
      // 创建一个测试文件
      const testFile = bucket.file('test/test-file.txt');
      await testFile.save('测试内容', {
        metadata: {
          contentType: 'text/plain'
        }
      });
      // 检查文件是否存在
      const [exists] = await testFile.exists();
      // 列出文件
      const [files] = await bucket.getFiles({ prefix: 'test/' });
      
      results.storage = {
        success: true,
        fileExists: exists,
        filesCount: files.length
      };

      // 清理测试文件
      await testFile.delete().catch(() => {});
    } catch (storageError) {
      results.storage = {
        success: false,
        error: storageError instanceof Error ? storageError.message : '未知错误'
      };
    }

    return res.status(200).json({
      success: results.firestore.success || results.storage.success,
      message: 'Firebase Admin SDK 测试完成',
      results
    });

  } catch (error) {
    console.error('Firebase Admin 测试失败:', error);
    return res.status(500).json({
      success: false,
      error: 'Firebase Admin 测试失败',
      details: error instanceof Error ? error.message : '未知错误',
      results
    });
  }
} 