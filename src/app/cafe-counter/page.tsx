'use client';

import { useEffect, useState } from 'react';

export default function CafeCounter() {
  const [totalPeople, setTotalPeople] = useState(0);
  const [toGoPeople, setToGoPeople] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pstTime = now.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTime(pstTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const incrementTotal = () => setTotalPeople((prev) => prev + 1);
  const minusTotal = () => setTotalPeople((prev) => prev - 1);

  const incrementToGo = () => setToGoPeople((prev) => prev + 1);
  const minusToGo = () => setToGoPeople((prev) => prev - 1);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Cafe People Counter</h1>

        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Current Time (PST)</p>
          <p className="text-xl font-mono font-bold text-gray-800">{currentTime}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <p className="text-lg font-semibold text-blue-800 mb-2">Number of People (All):</p>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-blue-600">{totalPeople}</span>
            <div className="flex gap-2">
              <button onClick={minusTotal} className="bg-blue-300 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">-1</button>
              <button onClick={incrementTotal} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">+1</button>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <p className="text-lg font-semibold text-green-800 mb-2">Number of People (To-Go):</p>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-green-600">{toGoPeople}</span>
            <div className="flex gap-2">
              <button onClick={minusToGo} className="bg-green-200 hover:bg-green-300 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">-1</button>
              <button onClick={incrementToGo} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">+1</button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setTotalPeople(0);
              setToGoPeople(0);
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Reset All Counters
          </button>
        </div>
      </div>
    </main>
  );
}
