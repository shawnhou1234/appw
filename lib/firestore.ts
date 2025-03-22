import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

interface AudioAnalysis {
  userId: string;
  transcription: string;
  emotions: {
    topEmotions: Array<{
      name: string;
      score: number;
    }>;
    timestamp: Date;
  };
  audioPath: string;
  createdAt: Date;
}

export async function saveAudioAnalysis(analysis: AudioAnalysis) {
  try {
    const docRef = await addDoc(collection(db, 'audioAnalysis'), {
      ...analysis,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('保存分析结果时出错:', error);
    throw error;
  }
}

export async function getUserAnalyses(userId: string) {
  try {
    const q = query(
      collection(db, 'audioAnalysis'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('获取用户分析记录时出错:', error);
    throw error;
  }
} 