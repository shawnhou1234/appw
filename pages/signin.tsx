import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { NextPage } from 'next';
import Link from 'next/link';
import NotionInput from '../components/NotionInput';

const SignIn: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-[#FFFFFF] shadow-lg sm:rounded-3xl sm:p-20 border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 hover:cursor-pointer">Sign In</h1>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <NotionInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email..."
                      required
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <NotionInput
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password..."
                      required
                      className="text-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                  >
                    Sign In
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-blue-600 hover:text-blue-500 hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        body {
          background-color: #FFFFFF;
        }
      `}</style>
    </div>
  );
};

export default SignIn; 