import { NextApiRequest, NextApiResponse } from 'next';
import { adminStorage } from '../../lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允许 GET 请求' });
  }

  try {
    // 1. 检查环境变量
    const envCheck = {
      openai: !!process.env.OPENAI_API_KEY,
      hume: !!process.env.HUME_AI_API_KEY,
    };

    // 2. 检查 Firebase Storage 连接
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ maxResults: 1 });
    const storageCheck = {
      connected: true,
      hasFiles: files.length > 0,
      firstFile: files.length > 0 ? files[0].name : null,
    };

    return res.status(200).json({
      success: true,
      message: '环境检查完成',
      checks: {
        environment: envCheck,
        storage: storageCheck,
      },
    });

  } catch (error) {
    console.error('测试失败:', error);
    return res.status(500).json({
      success: false,
      error: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
} 