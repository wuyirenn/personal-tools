// reddit credentials
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT;

import { CommentNode, MatchedPost, ScrapeParams, ScrapeResult } from "@/lib/types/reddit";

class RedditService {
  private id: string;
  private secret: string;
  private agent: string;
  private token: string | null = null;
  private tokenExpiryEpochMs: number = 0;

  // init
  constructor() {
    if (!REDDIT_CLIENT_ID|| !REDDIT_CLIENT_SECRET || !REDDIT_USER_AGENT) {
      throw new Error("missing credentials");
    }
    this.id = REDDIT_CLIENT_ID;
    this.secret = REDDIT_CLIENT_SECRET;
    this.agent = REDDIT_USER_AGENT;
  }

  private async fetchAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiryEpochMs - 10_000) return this.token;

    const basicAuth = Buffer.from(`${this.id}:${this.secret}`).toString("base64");
    const form = new URLSearchParams({ grant_type: "client_credentials" });
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.agent,
      },
      body: form.toString(),
      cache: "no-store" as RequestCache,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to obtain Reddit token: ${response.status} ${text}`);
    }
    const tokenJson: { access_token: string; expires_in: number } = await response.json();
    this.token = tokenJson.access_token;
    this.tokenExpiryEpochMs = Date.now() + tokenJson.expires_in * 1000;
    return this.token;
  }

  private async redditGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const token = await this.fetchAccessToken();
    const url = new URL(`https://oauth.reddit.com${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": this.agent },
      cache: "no-store" as RequestCache,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Reddit API error ${response.status}: ${text}`);
    }
    return response.json() as Promise<T>;
  }

  private buildNodesFromListingChildren(children: any[], nodeByFullname: Map<string, CommentNode>, moreIdsOut: string[]): CommentNode[] {
    const roots: CommentNode[] = [];
    for (const entry of children || []) {
      const kind = entry?.kind;
      const data = entry?.data || {};
      if (kind === "t1") {
        const body: string | undefined = data.body;
        if (!body) continue;
        const node: CommentNode = { body, replies: [] };
        const fullname = `t1_${data.id}`;
        nodeByFullname.set(fullname, node);
        const replyChildren = data.replies?.data?.children;
        if (Array.isArray(replyChildren)) {
          node.replies = this.buildNodesFromListingChildren(replyChildren, nodeByFullname, moreIdsOut);
        }
        // Top-level entries for this listing layer become roots of this subtree
        roots.push(node);
      } else if (kind === "more") {
        const childIds: string[] = Array.isArray(data.children) ? data.children : [];
        moreIdsOut.push(...childIds);
      }
    }
    return roots;
  }

  private async fetchMoreChildren(linkFullname: string, childIds: string[]): Promise<any[]> {
    const allThings: any[] = [];
    // Reddit allows up to ~100 IDs per call; batch if needed
    for (let i = 0; i < childIds.length; i += 100) {
      const batch = childIds.slice(i, i + 100);
      const data: any = await this.redditGet("/api/morechildren", {
        api_type: "json",
        link_id: linkFullname,
        children: batch.join(","),
        // limit_children: false
      });
      const things: any[] = data?.json?.data?.things ?? [];
      allThings.push(...things);
    }
    return allThings;
  }
  
  private attachThingsToTree(things: any[], nodeByFullname: Map<string, CommentNode>, roots: CommentNode[], moreIdsOut: string[]) {
    for (const thing of things || []) {
      const kind = thing?.kind;
      const data = thing?.data || {};
      if (kind === "t1") {
        const body: string | undefined = data.body;
        if (!body) continue;
        const node: CommentNode = { body, replies: [] };
        const fullname = `t1_${data.id}`;
        nodeByFullname.set(fullname, node);
        const parentFullname: string | undefined = data.parent_id;
        if (parentFullname && parentFullname.startsWith("t1_")) {
          const parent = nodeByFullname.get(parentFullname);
          if (parent) parent.replies.push(node);
          else roots.push(node); // fallback
        } else {
          // parent is the submission (t3)
          roots.push(node);
        }
        const replies = data.replies?.data?.children;
        if (Array.isArray(replies)) {
          const childRoots = this.buildNodesFromListingChildren(replies, nodeByFullname, moreIdsOut);
          node.replies.push(...childRoots);
        }
      } else if (kind === "more") {
        const childIds: string[] = Array.isArray(data.children) ? data.children : [];
        moreIdsOut.push(...childIds);
      }
    }
  }

  public async scrapeSubreddit(params: ScrapeParams): Promise<ScrapeResult> {
    const { subreddit, targetStrings, postLimit = null, query, matchMode = "keyword", anthropic } = params;
    const targets = (Array.isArray(targetStrings) ? targetStrings : [targetStrings])
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const posts: MatchedPost[] = [];
    let matchedPostCount = 0;
    let totalScanned = 0;

    let after: string | undefined = undefined;
    const pageSize = 100;
    const desired = postLimit ?? Infinity;
    const threshold = anthropic?.threshold ?? 0.5;
    const maxSemanticCalls = anthropic?.maxCalls ?? 200;
    let semanticCalls = 0;

    while (true) {
      const listing: any = await this.redditGet(`/r/${subreddit}/new`, { limit: pageSize, after });
      const children: any[] = listing?.data?.children ?? [];
      for (const child of children) {
        const post = child?.data ?? {};
        totalScanned += 1;
        const title: string | undefined = post.title;
        const selftext: string | undefined = post.selftext;
        const id: string | undefined = post.id;
        const hay = `${title || ""}\n${selftext || ""}`;
        const keywordMatched = targets.length > 0 && targets.some(t => hay.toLowerCase().includes(t));

        let matched = false;
        if (matchMode === "keyword") {
          matched = keywordMatched;
        } else if (matchMode === "semantic") {
          if (anthropic && query && semanticCalls < maxSemanticCalls) {
            const preview = hay.slice(0, 4000); // cap tokens by truncation
            const score = await anthropic.score(query, preview);
            semanticCalls += 1;
            matched = score >= threshold;
          } else {
            matched = false;
          }
        } else {
          // hybrid: keyword OR semantic
          if (keywordMatched) matched = true;
          else if (anthropic && query && semanticCalls < maxSemanticCalls) {
            const preview = hay.slice(0, 4000);
            const score = await anthropic.score(query, preview);
            semanticCalls += 1;
            matched = score >= threshold;
          } else matched = false;
        }
        if (!matched) continue;

        matchedPostCount += 1;
        const postRecord: MatchedPost = {
          title,
          selftext,
          author: post.author,
          url: post.url,
          permalink: post.permalink ? `https://reddit.com${post.permalink}` : undefined,
          created_utc: post.created_utc,
          num_comments: post.num_comments,
          comments: [],
        };

        if (id) {
          try {
            const threads: any[] = await this.redditGet(`/comments/${id}`, { limit: 500, depth: 10, sort: "new" });
            const listingChildren = threads?.[1]?.data?.children ?? [];
            const linkFullname = `t3_${id}`;
            const nodeByFullname = new Map<string, CommentNode>();
            const moreIds: string[] = [];
            const roots = this.buildNodesFromListingChildren(listingChildren, nodeByFullname, moreIds);
            let pending = moreIds;
            while (pending.length > 0) {
              const things = await this.fetchMoreChildren(linkFullname, pending);
              const nextMore: string[] = [];
              this.attachThingsToTree(things, nodeByFullname, roots, nextMore);
              pending = nextMore;
            }
            postRecord.comments = roots;
          } catch {}
        }

        posts.push(postRecord);
        if (posts.length >= desired && desired !== Infinity) break;
      }
      if (posts.length >= desired && desired !== Infinity) break;
      after = listing?.data?.after ?? undefined;
      if (!after || children.length === 0) break;
    }

    return { subreddit, targets, matchedPostCount, totalScanned, posts };
  }
}

export const reddit = new RedditService();