import React, { useState, useEffect, useRef } from 'react';
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
  onPlay: (recording: Recording) => void;
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
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async (recording: Recording) => {
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
      setDuration(recording.duration);

      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = recording.url;
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
  };

  const handleAudioEnded = () => {
    setCurrentPlayingId(null);
    setIsPaused(false);
    setProgress(0);
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Your Recordings</h2>
      {recordings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No recordings yet. Start recording to see your audio files here.
        </p>
      ) : (
        <div className="space-y-4">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                {editingId === recording.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim()) {
                        onRename(recording.id, editingName.trim());
                      }
                      setEditingId(null);
                      setEditingName('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingName.trim()) {
                        onRename(recording.id, editingName.trim());
                        setEditingId(null);
                        setEditingName('');
                      }
                    }}
                    className="flex-1 px-2 py-1 border rounded"
                    autoFocus
                  />
                ) : (
                  <h3
                    className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      setEditingId(recording.id);
                      setEditingName(recording.name);
                    }}
                  >
                    {recording.name}
                  </h3>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePlay(recording)}
                    className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
                  >
                    {currentPlayingId === recording.id && !isPaused ? (
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
                    className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Created on {formatDate(recording.createdAt)}
              </div>
              {currentPlayingId === recording.id && (
                <div className="space-y-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatDuration((progress / 100) * duration)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
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

export default RecordingsList; 