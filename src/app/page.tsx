"use client";

export default function Home() {
    return (
        <main className="flex flex-col gap-4 p-8">
            <div className="text-3xl mb-8">internal tools</div>
            <div className="flex flex-col gap-4 text-center w-50">
                <a className="py-3 px-6 text-white border-white border-2 rounded-md hover:bg-white hover:text-black transition-colors duration-200" href="/cafe-counter">cafe counter</a>
                <a className="py-3 px-6 text-white border-white border-2 rounded-md hover:bg-white hover:text-black transition-colors duration-200" href="/reddit-scraper">reddit-scraper</a>
            </div>
        </main>
    );
}
