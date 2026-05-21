import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAPFIX_PROXY_SECRET = process.env.TAPFIX_PROXY_SECRET;
const MODEL = process.env.MODEL;
const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-tapfix-secret"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function proofreadingPrompt(text) {
  return `You are a precise proofreading assistant.

Correct ONLY real writing mistakes:
- spelling mistakes
- typos
- punctuation mistakes
- obvious grammar mistakes

Strict rules:
- Preserve the original meaning.
- Preserve the author's style.
- Preserve the author's tone.
- Preserve slang, casual language, rough language, swear words and profanity.
- Do NOT censor profanity.
- Do NOT replace rude words with polite words.
- Do NOT make the text literary, official, polite, corporate or more professional.
- Do NOT rewrite the sentence structure unless it is required to fix a real mistake.
- Do NOT replace words with synonyms without necessity.
- Do NOT soften emotions.
- Keep the same language as the input text.
- Return only the corrected text.
- Do not explain anything.

If the text contains profanity with typos, correct the typos but keep the profanity.

Text:
${text}`;
}

function stylePrompt(text, writingStyle) {
  const style = writingStyle || "Neutral";

  if (typeof style === "string" && (style.includes("TEXT TRANSFORMATION TASK.") || style.includes("TRANSLATION TASK."))) {
    return `${style}

Text:
${text}`;
  }

  if (style === "Neutral") {
    return proofreadingPrompt(text);
  }

  let instruction = "";
  switch (style) {
    case "Polite":
      instruction = "Make the text more polite and respectful while keeping the same meaning and language.";
      break;
    case "Professional":
      instruction = "Make the text more formal, business-like and professional while keeping the same meaning and language.";
      break;
    case "Friendly":
      instruction = "Make the text warmer, friendlier and more natural while keeping the same meaning and language.";
      break;
    case "Short":
      instruction = "Make the text shorter, clearer and more direct while keeping the same meaning and language.";
      break;
    case "Emoji":
      instruction = "Make the text more expressive and natural, and add a few suitable emojis where appropriate. Do not overuse emojis.";
      break;
    default:
      instruction = "Improve the text while keeping the same meaning and language.";
      break;
  }

  return `You are a writing style assistant.

Task:
${instruction}

Rules:
- First fix spelling, punctuation, typos and obvious grammar mistakes.
- Preserve the original meaning.
- Preserve the original context.
- Keep the same language as the input text.
- Do not add new facts.
- Do not explain anything.
- Return only the final user-ready text.

Profanity and rough language rules:
- Do not censor profanity automatically.
- Do not remove swear words automatically.
- If the selected style naturally requires softer wording, you may soften the tone, but do not change the core meaning.
- If profanity is part of the intended emotional tone, preserve it unless it conflicts with the selected style.

Selected writing style:
${style}

Text:
${text}`;
}

function buildPrompt(action, text, targetLanguage, writingStyle) {
  const safeTarget = targetLanguage || "English";
  const safeStyle = writingStyle || "Neutral";

  switch (action) {
    case "assistant":
      return `You are TapFix AI.

The user's text is a direct task/request, not text to proofread.
Execute the request directly.
If the request includes a "Текст / контекст:" section, use that text as context.
Do not rewrite, correct, shorten, or improve the request itself.
Return only the useful final answer, recommendation, list, message, or ready-to-send text.
Do not explain that you are an AI.
Do not mention the prompt.
Keep the answer in the same language as the user's request unless the user asks for another language.

User request:
${text}`;

    case "fix":
      return proofreadingPrompt(text);

    case "improve":
    case "rewrite":
      return stylePrompt(text, safeStyle);

    case "translate":
      return `Translate the text into ${safeTarget}. Preserve the original meaning, tone, style, slang, rough language and profanity. Do not censor swear words. Return only the translation.

Text:
${text}`;

    case "shorten":
      return `Make the text shorter while preserving the meaning, tone, slang and profanity. Do not censor the text. Return only the shortened text.

Text:
${text}`;

    default:
      return stylePrompt(text, safeStyle);
  }
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-store"
        },
        body: ""
      };
    }

    if (event.httpMethod === "GET") {
      return json(200, {
        ok: true,
        service: "TapFix AI Netlify Proxy",
        endpoint: "/.netlify/functions/ai-proxy",
        modelConfigured: Boolean(MODEL),
        promptVersion: "style-aware-v3"
      });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    if (!OPENAI_API_KEY) {
      return json(500, { error: "Server is missing OPENAI_API_KEY" });
    }

    if (!MODEL) {
      return json(500, { error: "Server is missing MODEL" });
    }

    if (!MAX_TEXT_LENGTH || Number.isNaN(MAX_TEXT_LENGTH)) {
      return json(500, { error: "Server is missing MAX_TEXT_LENGTH" });
    }

    if (TAPFIX_PROXY_SECRET) {
      const providedSecret =
        event.headers["x-tapfix-secret"] ||
        event.headers["X-Tapfix-Secret"] ||
        "";
      if (providedSecret !== TAPFIX_PROXY_SECRET) {
        return json(401, { error: "Unauthorized proxy request" });
      }
    }

    const body = JSON.parse(event.body || "{}");
    const { action, text, targetLanguage, writingStyle } = body;

    if (!text || typeof text !== "string") {
      return json(400, { error: "Missing text" });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return json(413, {
        error: "Text is too long",
        maxTextLength: MAX_TEXT_LENGTH
      });
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const input = buildPrompt(action, text, targetLanguage, writingStyle);

    const response = await openai.responses.create({
      model: MODEL,
      input,
      temperature: 0.2
    });

    return json(200, {
      ok: true,
      result: response.output_text || ""
    });
  } catch (error) {
    console.error("TapFix AI proxy error:", error);
    return json(500, { error: "AI request failed" });
  }
}
