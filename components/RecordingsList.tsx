import React from 'react';
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
}

const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDelete,
  onPlay,
}) => {
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
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onPlay(recording.url)}
                  className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div>
                  <p className="font-medium text-gray-900">{recording.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(recording.createdAt)} • {formatDuration(recording.duration)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDelete(recording.id)}
                className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordingsList; 