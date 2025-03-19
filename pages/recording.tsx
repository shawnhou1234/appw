import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import RecordingButton from '../components/RecordingButton';
import RecordingsList from '../components/RecordingsList';

interface Recording {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  duration: number;
}

const RecordingPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      const recordingsRef = ref(storage, `audio/${userId}`);
      const result = await listAll(recordingsRef);
      
      const recordingsData = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          return {
            id: item.name,
            url,
            name: item.name.split('_')[0] || 'Recording',
            createdAt: new Date(metadata.timeCreated),
            duration: 0, // You might want to store this in metadata
          };
        })
      );

      setRecordings(recordingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading recordings:', error);
      setError('Failed to load recordings');
    }
  };

  const handleRecordingStart = () => {
    setError('');
  };

  const handleRecordingStop = async (blob: Blob) => {
    if (!user) return;

    setIsProcessing(true);
    setError('');

    try {
      const timestamp = new Date().getTime();
      const fileName = `recording_${timestamp}.webm`;
      const storageRef = ref(storage, `audio/${user.uid}/${fileName}`);
      
      await uploadBytes(storageRef, blob);
      await loadRecordings(user.uid);
    } catch (error) {
      console.error('Error uploading recording:', error);
      setError('Failed to upload recording');
    } finally {
      setIsProcessing(false);
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

  const handlePlay = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recording Studio</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Record Your Comedy</h2>
            <p className="text-gray-500">Click the button below to start recording</p>
          </div>
          <RecordingButton
            onStart={handleRecordingStart}
            onStop={handleRecordingStop}
            isProcessing={isProcessing}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <RecordingsList
            recordings={recordings}
            onDelete={handleDelete}
            onPlay={handlePlay}
          />
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default RecordingPage; 