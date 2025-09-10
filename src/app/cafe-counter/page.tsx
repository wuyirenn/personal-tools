"use client";

import { useEffect, useState } from "react";

export default function CafeCounter() {
  const [totalPeople, setTotalPeople] = useState(0);
  const [toGoPeople, setToGoPeople] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pstTime = now.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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
    <main className="flex flex-col h-screen min-w-xs w-full bg-black justify-between p-8">
      <div>
        <div className="text-3xl font-bold text-white mb-8">cafe people counter</div>

        <div className="rounded-md mb-6">
          <div className="text-sm text-white mb-1">current time (pst)</div>
          <div className="text-xl font-mono font-bold text-white">{currentTime}</div>
        </div>

        <div className="rounded-md mb-6">
          <div className="text-lg font-semibold text-white mb-2">number of people (all):</div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-white">{totalPeople}</span>
            <div className="flex gap-3 mt-2">
              <button onClick={minusTotal} className="border-2 border-white text-white hover:text-black hover:bg-white font-bold py-2 px-6 rounded-md transition-colors duration-200">-1</button>
              <button onClick={incrementTotal} className="border-2 border-white text-white hover:text-black hover:bg-white font-bold py-2 px-6 rounded-md transition-colors duration-200">+1</button>
            </div>
          </div>
        </div>

        <div className="rounded-lg">
          <div className="text-lg font-semibold text-white mb-2">number of people (to-go):</div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-white">{toGoPeople}</span>
            <div className="flex gap-3 mt-2">
              <button onClick={minusToGo} className="border-2 border-white text-white hover:text-black hover:bg-white font-bold py-2 px-6 rounded-md transition-colors duration-200">-1</button>
              <button onClick={incrementToGo} className="border-2 border-white text-white hover:text-black hover:bg-white font-bold py-2 px-6 rounded-md transition-colors duration-200">+1</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <a className="border-2 border-white hover:bg-white hover:text-black py-2 px-6 rounded-md transition-colors duration-200" href="/">
          back
        </a>
        <button
          onClick={() => {
            setTotalPeople(0);
            setToGoPeople(0);
          }}
          className= " bg-pink-400 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
        >
          reset counters
        </button>
      </div>
    </main>
  );
}
