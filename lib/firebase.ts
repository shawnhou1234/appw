// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA39waPUGbDqo2v0uBQ8p1qCkNTuzwXOlc",
  authDomain: "comedy-app-16e56.firebaseapp.com",
  projectId: "comedy-app-16e56",
  storageBucket: "comedy-app-16e56.firebasestorage.app",
  messagingSenderId: "373742772556",
  appId: "1:373742772556:web:1a484cf04006570fe96fe9",
  measurementId: "G-KNCMNK8QSS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on the client side
const analytics: Analytics | null = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

export { auth, analytics };