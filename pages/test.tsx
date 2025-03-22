import React, { useState } from 'react';
import axios from 'axios';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testProcessAudio = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. 首先检查环境
      console.log('检查环境...');
      const checkResponse = await axios.get('/api/test-process-audio');
      console.log('环境检查结果:', checkResponse.data);

      if (!checkResponse.data.success) {
        throw new Error('环境检查失败');
      }

      if (!checkResponse.data.checks.storage.hasFiles) {
        throw new Error('没有找到可用的音频文件');
      }

      // 2. 测试音频转录
      const testFile = checkResponse.data.checks.storage.firstFile;
      console.log('使用测试文件:', testFile);

      const processResponse = await axios.post('/api/process-audio', {
        filePath: testFile,
        userId: 'test-user-' + Date.now()
      });

      setResult(processResponse.data);
    } catch (err) {
      console.error('测试失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">音频转录测试</h1>
      
      <button
        onClick={testProcessAudio}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {loading ? '转录中...' : '开始转录'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          错误: {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">转录结果:</h2>
          <div className="p-4 bg-gray-100 rounded">
            <p className="mb-2"><strong>状态:</strong> {result.success ? '成功' : '失败'}</p>
            <p className="mb-2"><strong>消息:</strong> {result.message}</p>
            {result.results && (
              <>
                <p className="mb-2"><strong>转录文本:</strong></p>
                <p className="whitespace-pre-wrap">{result.results.transcription}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 