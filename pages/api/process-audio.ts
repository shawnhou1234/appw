import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { adminStorage } from '../../lib/firebaseAdmin';
import { adminDb } from '../../lib/firebaseAdmin';
import { processHumeEmotions, type EmotionScore, type ProcessedEmotions } from '../../lib/emotionUtils';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const HUME_API_KEY = process.env.HUME_API_KEY;
const HUME_API_ENDPOINT = 'https://api.hume.ai/v0/batch/jobs';

async function waitForHumeResults(jobId: string): Promise<any> {
  const maxAttempts = 10;
  const delayMs = 5000; // 5 seconds between attempts

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      const statusResponse = await axios.get(
        `${HUME_API_ENDPOINT}/${jobId}/predictions`,
        {
          headers: {
            'X-Hume-Api-Key': HUME_API_KEY
          }
        }
      );

      if (statusResponse.data.status === 'COMPLETED') {
        return statusResponse.data.predictions;
      }
      console.log(`尝试 ${attempt + 1}/${maxAttempts}: 作业仍在进行中...`);
    } catch (error) {
      console.error(`检查作业状态失败 (尝试 ${attempt + 1}/${maxAttempts}):`, error);
    }
  }
  throw new Error('Hume 分析超时');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    // 解析表单数据
    console.log('开始解析表单数据...');
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const audioFile = files.audio?.[0];
    const userId = fields.userId?.[0];

    if (!audioFile || !userId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    console.log('读取文件内容...');
    // 创建一个新的临时文件，确保文件扩展名正确
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}.webm`);
    
    // 复制文件到临时目录
    await fs.promises.copyFile(audioFile.filepath, tempFilePath);
    console.log('临时文件创建成功:', tempFilePath);

    // 上传到 Firebase Storage
    console.log('上传到 Firebase Storage...');
    const timestamp = Date.now();
    const fileName = `recording-${timestamp}.webm`;
    const filePath = `test-audio/${fileName}`;
    
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    
    await file.save(await fs.promises.readFile(tempFilePath), {
      metadata: {
        contentType: 'audio/webm',
        metadata: {
          timestamp: timestamp.toString(),
        },
      },
    });
    console.log('文件上传成功:', filePath);

    // 转录音频
    console.log('开始音频转录...');
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      response_format: 'text'
    });

    const transcription = transcriptionResponse;
    console.log('转录完成:', transcription);

    // 情感分析
    console.log('开始情感分析...');
    let emotions: ProcessedEmotions = {
      topEmotions: [],
      timestamp: new Date()
    };

    try {
      if (HUME_API_KEY) {
        // 准备 Hume API 请求
        const humeForm = new FormData();
        const fileBuffer = await fs.promises.readFile(tempFilePath);
        const fileBlob = new Blob([fileBuffer], { type: 'audio/webm' });
        humeForm.append('file', fileBlob, 'audio.webm');
        
        // 设置模型配置
        humeForm.append('json', JSON.stringify({
          models: { 
            speech: {} // 使用语音情感分析模型
          }
        }));

        console.log('发送 Hume API 请求...');
        // 发送作业请求
        const jobStartRes = await axios.post(HUME_API_ENDPOINT, humeForm, {
          headers: {
            'X-Hume-Api-Key': HUME_API_KEY,
          }
        });

        const jobId = jobStartRes.data.job_id;
        console.log('Hume 作业已创建:', jobId);

        // 等待并获取结果
        console.log('等待 Hume 分析结果...');
        const humeResults = await waitForHumeResults(jobId);
        console.log('收到 Hume 原始结果:', JSON.stringify(humeResults, null, 2));
        
        emotions = processHumeEmotions(humeResults);
        console.log('情感分析完成:', emotions);
      } else {
        console.error('未设置 HUME_API_KEY');
      }
    } catch (error) {
      console.error('情感分析失败:', error);
      // 不抛出错误，让流程继续
    }

    // 保存到 Firestore
    console.log('保存结果到 Firestore...');
    const docRef = adminDb.collection('users').doc(userId).collection('entries').doc();
    
    const entryData = {
      userId,
      transcription,
      emotions,
      audioPath: filePath,
      createdAt: new Date(),
      timestamp: new Date()
    };

    await docRef.set(entryData);
    console.log('保存成功, docId:', docRef.id);

    // 清理临时文件
    await fs.promises.unlink(audioFile.filepath);
    await fs.promises.unlink(tempFilePath);

    return res.status(200).json({
      success: true,
      docId: docRef.id,
      transcription,
      emotions
    });

  } catch (error) {
    console.error('处理音频时出错:', error);
    return res.status(500).json({ 
      error: '处理音频时出错',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
} 