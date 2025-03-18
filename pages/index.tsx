import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-[#FFFFFF] py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-[#FFFFFF] shadow-lg sm:rounded-3xl sm:p-20 border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-6 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-5xl font-bold text-gray-900 mb-8 hover:cursor-pointer">Welcome to Shawn App</h1>
                <p className="text-xl text-gray-600">Your new Next.js application is ready.</p>
                <p className="text-xl text-gray-600">Start building something amazing!</p>
                <div className="mt-12 space-y-4">
                  <Link href="/signin" className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md hover:shadow-lg">
                    Sign In
                  </Link>
                  <Link href="/signup" className="block w-full text-center py-3 px-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition duration-200 shadow-md hover:shadow-lg border border-blue-200">
                    Sign Up
                  </Link>
                </div>
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

export default Home; 