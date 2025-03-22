import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 更新 Hume AI 配置
const HUME_API_KEY = process.env.HUME_AI_API_KEY;
const HUME_API_ENDPOINT = 'https://api.hume.ai/v0/batch/jobs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允许 GET 请求' });
  }

  try {
    // 测试 OpenAI API
    let openaiStatus = 'unknown';
    let openaiError = null;
    try {
      const models = await openai.models.list();
      openaiStatus = models.data.length > 0 ? 'ok' : 'error';
    } catch (error) {
      openaiStatus = 'error';
      openaiError = error instanceof Error ? error.message : '未知错误';
      console.error('OpenAI API 测试失败:', error);
    }

    // 测试 Hume AI API
    let humeStatus = 'unknown';
    let humeError = null;
    try {
      // 创建一个测试作业请求
      const testJobRequest = {
        models: {
          language: {}  // 使用最简单的语言模型进行测试
        },
        text: ['Hello world']  // 简单的测试文本
      };

      const humeResponse = await axios.post(HUME_API_ENDPOINT, testJobRequest, {
        headers: {
          'X-Hume-Api-Key': HUME_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      humeStatus = humeResponse.status === 200 ? 'ok' : 'error';
    } catch (error) {
      humeStatus = 'error';
      humeError = error instanceof Error ? error.message : '未知错误';
      console.error('Hume AI API 测试失败:', error);
    }

    // 返回详细的测试结果
    return res.status(200).json({
      success: true,
      apis: {
        openai: {
          status: openaiStatus,
          key: process.env.OPENAI_API_KEY ? '已配置' : '未配置',
          error: openaiError
        },
        hume: {
          status: humeStatus,
          key: process.env.HUME_AI_API_KEY ? '已配置' : '未配置',
          error: humeError
        }
      },
      env: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        HUME_AI_API_KEY: !!process.env.HUME_AI_API_KEY
      }
    });

  } catch (error) {
    console.error('API 测试失败:', error);
    return res.status(500).json({
      success: false,
      error: 'API 测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
} 