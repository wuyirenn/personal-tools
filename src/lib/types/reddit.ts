// reddit scraper shared types

export type CommentNode = {
    body: string;
    replies: CommentNode[];
};

export type MatchedPost = {
    title?: string;
    selftext?: string;
    author?: string;
    url?: string;
    permalink?: string;
    created_utc?: number;
    num_comments?: number;
    comments: CommentNode[];
};

export type ScrapeParams = {
    subreddit: string;
    targetStrings: string | string[];
    postLimit?: number | null;
    query?: string;
    matchMode?: "keyword" | "semantic" | "hybrid";
    anthropic?: {
        score: (query: string, content: string) => Promise<number>;
        threshold?: number; // default 0.5
        maxCalls?: number; // safety to limit token usage (default 200)
    };
};

export type ScrapeResult = {
    subreddit: string;
    targets: string[];
    matchedPostCount: number;
    totalScanned: number;
    posts: MatchedPost[];
};


