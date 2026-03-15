import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  process.env.OPENAI_API_KEY
    ? globalForOpenAI.openai ??
      new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

if (process.env.NODE_ENV !== "production" && openai) globalForOpenAI.openai = openai;
