import { NextApiRequest, NextApiResponse } from 'next';
import { adminStorage } from '../../lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const bucket = adminStorage.bucket();
    const [bucketExists] = await bucket.exists();
    const [files] = await bucket.getFiles({ maxResults: 1 });

    return res.status(200).json({
      success: true,
      bucketExists,
      bucketName: bucket.name,
      filesCount: files.length,
      files: files.map(file => file.name)
    });
  } catch (error) {
    console.error('Firebase Storage 测试失败:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
} 