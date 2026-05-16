import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

let client;

function getClient() {
  if (!env.GROQ_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return client;
}

export function isGroqConfigured() {
  return Boolean(env.GROQ_API_KEY);
}

/**
 * @param {Array<{role:string, content:string}>} messages
 * @param {{ temperature?: number, maxTokens?: number, jsonMode?: boolean }} opts
 */
export async function chatComplete(messages, opts = {}) {
  const c = getClient();
  if (!c) {
    throw new AppError(
      'AI is not configured. Add GROQ_API_KEY to your environment.',
      503
    );
  }
  try {
    const completion = await c.chat.completions.create({
      model: env.GROQ_MODEL,
      messages,
      temperature: opts.temperature ?? 0.35,
      max_tokens: opts.maxTokens ?? 1200,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (e) {
    logger.error('Groq API error', { message: e.message });
    throw new AppError(
      e.message || 'Groq request failed',
      e.status || 502
    );
  }
}
