// reddit semantic scoring using Anthropic (server-side only)

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export class AnthropicService {
  private apiKey: string;

  constructor() {
    if (!ANTHROPIC_API_KEY) throw new Error("missing ANTHROPIC_API_KEY");
    this.apiKey = ANTHROPIC_API_KEY;
  }

  // returns a 0..1 relevance score for content relative to query using a lightweight prompt
  async score(query: string, content: string): Promise<number> {
    const system = "You are a scoring function. Given a user query and a content snippet, return ONLY a floating point relevance score between 0 and 1.";
    const prompt = `Query: ${query}\nContent: ${content}\nScore:`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 8,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      // fail closed with zero to avoid selecting content
      return 0;
    }

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? "0";
    const parsed = parseFloat((text.match(/[0-1](?:\.\d+)?/) || ["0"]) [0]);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(1, parsed));
    return 0;
  }
}

export const anthropic = new AnthropicService();
