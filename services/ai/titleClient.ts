type Provider = "groq" | "gemini" | "nvidia";
type Mode = "slash" | "ghost" | "suggest";

interface GenerateTitleArgs {
  provider: Provider;
  model?: string;
  mode: Mode;
  input: string;
  description?: string;
  tags?: string[];
}

const PROVIDERS: Record<
  Provider,
  { baseUrl: string; apiKey: string | undefined; model: string }
> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/",
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_TITLE_MODEL || "llama-3.1-8b-instant",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_TITLE_MODEL || "gemini-1.5-flash",
  },
  nvidia: {
    baseUrl: "https://integrate.api.nvidia.com/v1/",
    apiKey: process.env.NVIDIA_API_KEY_NEW,
    model: process.env.NVIDIA_TITLE_MODEL || "meta/llama-3.1-70b-instruct",
  },
};

// ---------- utils ----------
const cleanText = (value: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const parseTitleList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) =>
      cleanText(
        line
          .replace(/^(\d+[\).\]-]|\d+[:.]|[-*•])\s*/, "")
          .replace(/^["'`]+|["'`]+$/g, ""),
      ),
    )
    .filter(Boolean)
    .slice(0, 3);

const normalizeGhostCompletion = (prefix: string, output: string) => {
  const p = cleanText(prefix);
  let o = cleanText(output);

  if (!o) return "";

  if (o.toLowerCase().startsWith(p.toLowerCase())) {
    o = cleanText(o.slice(p.length));
  }

  return o;
};

const limitWords = (text: string, maxWords = 6) =>
  text.split(" ").slice(0, maxWords).join(" ");

const isTitleAlreadyGood = (input: string) => {
  const words = input.trim().split(/\s+/).length;
  return words >= 8;
};

// ---------- AI CALL ----------
async function providerChat(
  provider: Provider,
  messages: { role: string; content: string }[],
  temperature = 0.4,
  modelOverride?: string,
) {
  const cfg = PROVIDERS[provider];

  if (!cfg.apiKey) {
    throw new Error(`${provider.toUpperCase()} API key is missing`);
  }

  const modelToUse = modelOverride || cfg.model;

  const response = await fetch(new URL("chat/completions", cfg.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelToUse,
      messages,
      temperature,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.toUpperCase()} request failed: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) throw new Error("AI returned empty response");

  return content.trim();
}

// ---------- MAIN ----------
export async function generateTitles({
  provider,
  model,
  mode,
  input,
  description = "",
  tags = [],
}: GenerateTitleArgs) {
  const contextLines = [
    `User text: ${input}`,
    description ? `Description: ${description}` : "",
    tags.length ? `Tags: ${tags.join(", ")}` : "",
  ].filter(Boolean);

  let prompt = "";

  if (mode === "suggest") {
    prompt = `TASK: Generate 3 high-quality blog titles.

STRICT RULES:
- EXACTLY 3 titles
- Each title MUST be on a new line
- NO numbering
- NO quotes
- NO explanations
- Each title MUST be under 10 words
- Each title MUST be COMPLETE and FINAL
- Titles must sound professional and strong
- Titles must NOT be generic or vague
- Titles must NOT repeat similar phrasing

STYLE:
- Sharp
- Clear
- Impactful
- No filler words

INPUT:
${contextLines.join("\n")}

OUTPUT FORMAT:
Title one
Title two
Title three`;
  }

  if (mode === "ghost") {
    prompt = `TASK: Continue the given blog title.

INPUT:
${input}

STRICT RULES (NO EXCEPTIONS):
- Output ONLY the missing continuation
- NEVER repeat the input
- NEVER rewrite the title
- NEVER add punctuation at the beginning
- NEVER explain anything
- NEVER output full sentences
- Output MUST be between 2 and 5 words ONLY
- Output MUST feel like the END of a title
- STOP immediately after completing the title
- If the title already feels complete → RETURN EMPTY STRING

HARD LIMITS:
- Max 5 words
- No fluff
- No generic phrases like "in today's world", "comprehensive guide"
- No over-extension

GOOD EXAMPLES:

Input: AI in healthcare
Output: applications and future trends

Input: React performance optimization
Output: techniques for faster apps

Input: Complete blog title example
Output:

FINAL OUTPUT:`;
  }

  if (mode === "slash") {
    prompt = `TASK: Generate ONE final blog title.

STRICT RULES:
- Output ONLY the title
- NO quotes
- NO explanations
- NO multiple options
- Title MUST be under 10 words
- Title MUST be complete and final
- Title MUST sound natural and engaging
- Avoid generic or boring phrasing
- No filler words

BEHAVIOR:
- If input is weak → improve it
- If input is strong → refine it
- Output must feel like a finished headline

INPUT:
${contextLines.join("\n")}

FINAL OUTPUT:`;
  }

  const content = await providerChat(
    provider,
    [
      {
        role: "system",
        content:
          "You generate short, clean, high-quality blog titles. Never over-generate.",
      },
      { role: "user", content: prompt },
    ],
    mode === "suggest" ? 0.7 : 0.4,
    model,
  );

  if (mode === "suggest") {
    const titles = parseTitleList(content);
    return { titles };
  }

  if (mode === "ghost") {
    if (isTitleAlreadyGood(input)) return { completion: "" };

    let completion = normalizeGhostCompletion(input, content);
    completion = limitWords(completion, 6);

    return { completion };
  }

  return {
    title: limitWords(cleanText(content), 12),
  };
}
