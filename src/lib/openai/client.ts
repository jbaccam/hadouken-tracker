import OpenAI from "openai";

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
  return _openai;
}
