import { NextRequest, NextResponse } from "next/server";
import { reddit } from "@/lib/services/reddit-service";
import { anthropic } from "@/lib/services/anthropic-service";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subreddit = searchParams.get("subreddit") || "";
    const target = searchParams.get("target") || "";
    const postLimitParam = searchParams.get("postLimit");
    const postLimit = postLimitParam ? Number(postLimitParam) : null;

    const result = await reddit.scrapeSubreddit({ subreddit, targetStrings: target, postLimit });

    const dir = path.join(process.env.HOME || process.cwd(), "Downloads", "reddit-scraping");
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${subreddit || "subreddit"}-${Date.now()}.json`;
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
    return NextResponse.json({
      ok: true,
      subreddit: result.subreddit,
      targets: result.targets,
      matchedPostCount: result.matchedPostCount,
      totalScanned: result.totalScanned,
      filePath: path.join(dir, fileName),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subreddit: string = body.subreddit || "";
    const targetStrings: string | string[] = body.targetStrings || body.target || "";
    const postLimit: number | null = typeof body.postLimit === "number" ? body.postLimit : null;
    const query: string | undefined = body.query || undefined;
    const matchMode: "keyword" | "semantic" | "hybrid" = body.matchMode || "keyword";
    const threshold: number | undefined = typeof body.threshold === "number" ? body.threshold : undefined;
    const maxCalls: number | undefined = typeof body.maxCalls === "number" ? body.maxCalls : undefined;

    const result = await reddit.scrapeSubreddit({
      subreddit,
      targetStrings,
      postLimit,
      query,
      matchMode,
      anthropic: matchMode === "keyword" ? undefined : { score: anthropic.score.bind(anthropic), threshold, maxCalls },
    });

    const dir = path.join(process.env.HOME || process.cwd(), "Downloads", "reddit-scraping");
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${subreddit || "subreddit"}-${Date.now()}.json`;
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");

    return NextResponse.json({
      ok: true,
      subreddit: result.subreddit,
      targets: result.targets,
      matchedPostCount: result.matchedPostCount,
      totalScanned: result.totalScanned,
      filePath: path.join(dir, fileName),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}


