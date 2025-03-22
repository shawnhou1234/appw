import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata, updateMetadata } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import RecordingButton from '../components/RecordingButton';
import RecordingsList from '../components/RecordingsList';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EmotionScore {
  name: string;
  score: number;
}

interface Recording {
  id: string;
  transcription: string;
  emotions: {
    topEmotions: EmotionScore[];
    timestamp: Date;
  };
  audioPath: string;
  createdAt: Date;
  url?: string;
  duration?: number;
  name?: string;
}

const RecordingPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        loadRecordings(user.uid);
      } else {
        router.push('/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadRecordings = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'users', userId, 'entries'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const recordingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recording[];

      setRecordings(recordingsData);
      setLoading(false);
    } catch (err) {
      console.error('加载录音失败:', err);
      setError('加载录音失败');
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      // 如果正在播放，先停止播放
      if (currentPlayingId && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentPlayingId(null);
        setIsPaused(false);
        setProgress(0);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleStopRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      startTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please try again.');
    }
  };

  const handleStopRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const timestamp = Date.now();
      const fileName = `audio/${user.uid}/${timestamp}.webm`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(storageRef);

      const newRecording: Recording = {
        id: timestamp.toString(),
        transcription: '',
        emotions: {
          topEmotions: [],
          timestamp: new Date()
        },
        audioPath: fileName,
        createdAt: new Date(),
        url,
        name: `Recording ${recordings.length + 1}`
      };

      setRecordings((prev) => [...prev, newRecording]);
      setIsRecording(false);
      stopTimer();
    } catch (error) {
      console.error('Error saving recording:', error);
      setError('Failed to save recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlay = async (recording: Recording) => {
    // 如果正在录音，不允许播放
    if (isRecording) {
      setError('Please stop recording before playing audio.');
      return;
    }

    if (currentPlayingId === recording.id) {
      if (isPaused) {
        await audioRef.current?.play();
        setIsPaused(false);
      } else {
        audioRef.current?.pause();
        setIsPaused(true);
      }
    } else {
      // Stop current playback if any
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Start new playback
      setCurrentPlayingId(recording.id);
      setIsPaused(false);
      setProgress(0);
      setDuration(recording.duration || 0);

      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = recording.url || recording.audioPath;
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Error playing audio:', error);
          setError('Failed to play audio. Please try again.');
        }
      }
    }
  };

  const handleRename = async (id: string, newName: string) => {
    if (!user) return;

    try {
      const storageRef = ref(storage, `audio/${user.uid}/${id}`);
      const metadata = {
        customMetadata: {
          name: newName
        }
      };
      await updateMetadata(storageRef, metadata);
      await loadRecordings(user.uid);
    } catch (error) {
      console.error('Error renaming recording:', error);
      setError('Failed to rename recording');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const storageRef = ref(storage, `audio/${user.uid}/${id}`);
      await deleteObject(storageRef);
      await loadRecordings(user.uid);
    } catch (error) {
      console.error('Error deleting recording:', error);
      setError('Failed to delete recording');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">我的录音</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            登出
          </button>
        </div>

        <div className="space-y-6">
          {recordings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">还没有录音</p>
            </div>
          ) : (
            recordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      转录文本
                    </h3>
                    <p className="text-gray-700">{recording.transcription}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      情感分析
                    </h3>
                    <div className="space-y-2">
                      {recording.emotions.topEmotions.map((emotion, index) => (
                        <div
                          key={emotion.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-700">{emotion.name}</span>
                          <div className="flex-1 mx-4">
                            <div className="h-2 bg-gray-200 rounded">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{ width: `${emotion.score * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-gray-500">
                            {(emotion.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    录制时间: {new Date(recording.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <audio
        ref={audioRef}
        onEnded={() => {
          setCurrentPlayingId(null);
          setIsPaused(false);
          setProgress(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current && !audioRef.current.paused) {
            const currentTime = audioRef.current.currentTime;
            const newProgress = (currentTime / duration) * 100;
            setProgress(newProgress);
          }
        }}
      />
    </div>
  );
};

export default RecordingPage; 