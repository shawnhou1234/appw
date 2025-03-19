import React, { useState, useRef, useEffect } from 'react';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface Recording {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  duration: number;
}

interface RecordingsListProps {
  recordings: Recording[];
  onDelete: (id: string) => void;
  onPlay: (url: string) => void;
  onRename: (id: string, newName: string) => void;
}

const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDelete,
  onPlay,
  onRename,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [isPaused, setIsPaused] = useState<{ [key: string]: boolean }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const progressIntervalRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    return () => {
      // 清理所有音频和定时器
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      Object.values(progressIntervalRefs.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  const handlePlayPause = (recording: Recording) => {
    const audio = audioRefs.current[recording.id];
    
    if (!audio) {
      // 创建新的音频元素
      const newAudio = new Audio(recording.url);
      audioRefs.current[recording.id] = newAudio;
      
      newAudio.addEventListener('timeupdate', () => {
        setProgress(prev => ({
          ...prev,
          [recording.id]: (newAudio.currentTime / newAudio.duration) * 100
        }));
      });

      newAudio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setIsPaused(prev => ({ ...prev, [recording.id]: false }));
        setProgress(prev => ({
          ...prev,
          [recording.id]: 0
        }));
      });

      newAudio.play();
      setCurrentlyPlaying(recording.id);
      setIsPaused(prev => ({ ...prev, [recording.id]: false }));
    } else {
      if (audio.paused) {
        audio.play();
        setCurrentlyPlaying(recording.id);
        setIsPaused(prev => ({ ...prev, [recording.id]: false }));
      } else {
        audio.pause();
        setIsPaused(prev => ({ ...prev, [recording.id]: true }));
      }
    }
  };

  const handleRenameStart = (recording: Recording) => {
    setEditingId(recording.id);
    setEditingName(recording.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim()) {
      onRename(id, editingName.trim());
      setEditingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Your Recordings</h3>
      {recordings.length === 0 ? (
        <p className="text-gray-500">No recordings yet. Start recording to see them here!</p>
      ) : (
        <div className="space-y-4">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {editingId === recording.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(recording.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleRenameSubmit(recording.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{recording.name}</span>
                    <button
                      onClick={() => handleRenameStart(recording)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(recording.createdAt)} • {formatDuration(recording.duration)}
                </div>
                {(currentlyPlaying === recording.id || isPaused[recording.id]) && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                      style={{ width: `${progress[recording.id] || 0}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePlayPause(recording)}
                  className="p-2 text-blue-500 hover:text-blue-700"
                >
                  {(currentlyPlaying === recording.id || isPaused[recording.id]) ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => onDelete(recording.id)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordingsList; 