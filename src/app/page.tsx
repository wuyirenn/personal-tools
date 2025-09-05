'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="">Internal Tools</h1>
      <ul>
        <li className="">
          <a className="p-2 text-white border-white border-2 rounded-md hover:bg-white hover:text-black" href="/cafe-counter">Cafe Counter</a>
        </li>
      </ul>
    </main>
  );
}
