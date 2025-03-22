import React, { useState, useRef } from 'react';
import { getUserAnalyses } from '../lib/firestore';

interface EmotionScore {
  name: string;
  score: number;
}

export default function TestAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [emotions, setEmotions] = useState<EmotionScore[]>([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      console.error('录音失败:', err);
      setError('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async () => {
    if (!audioBlob) {
      setError('没有可用的录音');
      return;
    }

    try {
      setError('');
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('userId', 'test-user');

      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '音频处理失败');
      }

      const result = await response.json();
      setTranscription(result.transcription);
      if (result.emotions && result.emotions.topEmotions) {
        setEmotions(result.emotions.topEmotions);
      }
    } catch (err) {
      console.error('处理失败:', err);
      setError(err instanceof Error ? err.message : '音频处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">音频测试页面</h1>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isRecording ? '停止录音' : '开始录音'}
          </button>
          
          {audioBlob && !isRecording && (
            <button
              onClick={processAudio}
              disabled={isProcessing}
              className={`px-4 py-2 rounded ${
                isProcessing
                  ? 'bg-gray-400'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isProcessing ? '处理中...' : '处理录音'}
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-500">
            错误: {error}
          </div>
        )}

        {transcription && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">转录结果:</h2>
            <p className="p-4 bg-gray-100 rounded">{transcription}</p>
          </div>
        )}

        {emotions.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">情感分析结果:</h2>
            <div className="space-y-2">
              {emotions.map((emotion, index) => (
                <div key={emotion.name} className="flex items-center space-x-4">
                  <span className="w-24 text-gray-700">{emotion.name}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-blue-500 rounded"
                      style={{ width: `${emotion.score * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-16 text-right text-gray-600">
                    {(emotion.score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 