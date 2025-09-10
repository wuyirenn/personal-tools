"use client";

import { useState } from "react";

export default function RedditScraperPage() {
  const [subreddit, setSubreddit] = useState("");
  const [targetStrings, setTargetStrings] = useState("");
  const [postLimit, setPostLimit] = useState<string>("");
  const [query, setQuery] = useState("");
  const [matchMode, setMatchMode] = useState<"keyword" | "semantic" | "hybrid">("keyword");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ matchedPostCount: number; totalScanned: number; targets: string[]; filePath: string } | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: any = {
        subreddit,
        targetStrings: targetStrings
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        query: query || undefined,
        matchMode,
      };
      if (postLimit) body.postLimit = Number(postLimit);

      const res = await fetch("/api/reddit/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");
      setResult({ matchedPostCount: json.matchedPostCount, totalScanned: json.totalScanned, targets: json.targets, filePath: json.filePath });
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen min-w-xs w-full bg-black justify-between p-8">
      <div>
        <div className="text-3xl font-bold text-white mb-8">reddit scraper</div>

        <div className="rounded-md mb-6">
          <div className="block text-sm text-white mb-2">subreddit</div>
          <input
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            placeholder="e.g. augmentedreality"
            className="w-full bg-black text-white border-2 border-white rounded-md px-3 py-2"
          />
        </div>

        <div className="rounded-md mb-6">
          <div className="block text-sm text-white mb-2">natural language query (optional)</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. posts discussing apple vision pro accessories"
            className="w-full bg-black text-white border-2 border-white rounded-md px-3 py-2"
          />
        </div>

        <div className="rounded-md mb-6">
          <div className="block text-sm text-white mb-2">match mode</div>
          <select
            value={matchMode}
            onChange={(e) => setMatchMode(e.target.value as any)}
            className="w-full bg-black text-white border-2 border-white rounded-md px-3 py-2"
          >
            <option value="keyword">keyword only</option>
            <option value="semantic">semantic only (Anthropic)</option>
            <option value="hybrid">hybrid (keyword or semantic)</option>
          </select>
        </div>

        <div className="rounded-md mb-6">
          <div className="block text-sm text-white mb-2">target strings (comma separated)</div>
          <input
            value={targetStrings}
            onChange={(e) => setTargetStrings(e.target.value)}
            placeholder="e.g. augmentos, apple, vision"
            className="w-full bg-black text-white border-2 border-white rounded-md px-3 py-2"
          />
        </div>

        <div className="rounded-md mb-6">
          <div className="block text-sm text-white mb-2">post limit (optional)</div>
          <input
            value={postLimit}
            onChange={(e) => setPostLimit(e.target.value)}
            placeholder="e.g. 200"
            className="w-full bg-black text-white border-2 border-white rounded-md px-3 py-2"
          />
        </div>

        <div className="rounded-md mb-6">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="border-2 border-white text-white hover:text-black hover:bg-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
          >
            {loading ? "scraping..." : "scrape"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}

        {result && (
          <div className="rounded-md mb-6 text-white space-y-2">
            <div className="text-sm">matched posts: {result.matchedPostCount}</div>
            <div className="text-sm">total scanned: {result.totalScanned}</div>
            <div className="text-sm">targets: {result.targets.join(', ')}</div>
            <div className="text-sm break-all">saved to: {result.filePath}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <a className="border-2 border-white hover:bg-white hover:text-black py-2 px-6 rounded-md transition-colors duration-200" href="/">
          back
        </a>
        <button
          onClick={() => {
            setResult(null);
            setError(null);
          }}
          className=" bg-pink-400 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
        >
          clear results
        </button>
      </div>
    </main>
  );
}

