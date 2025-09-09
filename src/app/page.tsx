'use client';

export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1 className="text-3xl mb-8">internal tools</h1>
      <ul>
        <li className="">
          <a className="py-3 px-6 text-white border-white border-2 rounded-md hover:bg-white hover:text-black transition-colors duration-200" href="/cafe-counter">Cafe Counter</a>
        </li>
      </ul>
    </main>
  );
}
