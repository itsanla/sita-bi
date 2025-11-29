import axios, { type AxiosError } from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ENHANCED_SYSTEM_PROMPT } from './gemini-prompt';
import { logger } from '../utils/logger';

dotenv.config();

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
  role?: 'model' | 'user';
}

interface GeminiSystemInstruction {
  parts: GeminiPart[];
}

interface GeminiRequest {
  systemInstruction?: GeminiSystemInstruction;
  contents: GeminiContent[];
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
    code?: number;
  };
}

class GeminiService {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private readonly streamBaseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent';
  private readonly requestTimeout = 30000; // 30 seconds
  private readonly streamTimeout = 60000; // 60 seconds for streaming
  private readonly documentationPath = path.join(
    process.cwd(),
    'documentation',
    'model',
    'documentation.json',
  );
  private readonly informationPath = path.join(
    process.cwd(),
    'documentation',
    'model',
    'information.json',
  );
  private systemPromptCache: string | null = null;
  private systemPromptCacheTime = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    // Load all 10 API keys from environment variables
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (typeof key === 'string' && key !== `your-gemini-api-key-${i}`) {
        this.apiKeys.push(key);
      }
    }

    if (this.apiKeys.length === 0) {
      logger.warn(
        'No valid Gemini API keys found. Please configure GEMINI_API_KEY_1 to GEMINI_API_KEY_10 in .env file',
      );
    } else {
      logger.info(`Loaded ${this.apiKeys.length} Gemini API key(s)`);
    }
  }

  private getSystemPrompt(): string {
    // Return cached prompt if still valid
    const now = Date.now();
    if (
      this.systemPromptCache !== null &&
      now - this.systemPromptCacheTime < this.CACHE_TTL
    ) {
      return this.systemPromptCache;
    }

    try {
      // Read documentation.json
      const documentationData = fs.existsSync(this.documentationPath)
        ? JSON.parse(fs.readFileSync(this.documentationPath, 'utf-8'))
        : null;

      // Read information.json
      const informationData = fs.existsSync(this.informationPath)
        ? JSON.parse(fs.readFileSync(this.informationPath, 'utf-8'))
        : null;

      // Build system prompt
      let systemPrompt = `Kamu adalah SITABI (Sistem Informasi Tugas Akhir Bahasa Inggris), asisten AI yang membantu mahasiswa jurusan Bahasa Inggris dalam mengelola dan menyelesaikan tugas akhir mereka. Kamu ramah, profesional, dan selalu siap membantu mahasiswa dengan pertanyaan seputar sistem informasi tugas akhir, panduan penulisan, jadwal bimbingan, dan informasi akademik terkait.

SUMBER INFORMASI YANG KAMU MILIKI:
`;

      if (documentationData !== null) {
        systemPrompt += `
1. INFORMASI PATH/LOKASI URL/HALAMAN SISTEM (dari documentation.json):
${JSON.stringify(documentationData, null, 2)}
`;
      }

      if (informationData !== null) {
        systemPrompt += `
2. INFORMASI TUGAS AKHIR & PANDUAN PENGGUNA (dari information.json):
${JSON.stringify(informationData, null, 2)}
`;
      }

      systemPrompt += ENHANCED_SYSTEM_PROMPT;

      // Cache the prompt
      this.systemPromptCache = systemPrompt;
      this.systemPromptCacheTime = now;

      return systemPrompt;
    } catch (error) {
      logger.error('Error loading system prompt data', error);
      const fallback = `Kamu adalah SITABI (Sistem Informasi Tugas Akhir Bahasa Inggris), asisten AI yang membantu mahasiswa jurusan Bahasa Inggris dalam mengelola dan menyelesaikan tugas akhir mereka. Kamu ramah, profesional, dan selalu siap membantu mahasiswa dengan pertanyaan seputar sistem informasi tugas akhir, panduan penulisan, jadwal bimbingan, dan informasi akademik terkait.`;

      // Cache fallback too
      this.systemPromptCache = fallback;
      this.systemPromptCacheTime = now;

      return fallback;
    }
  }

  private async callGeminiApi(prompt: string, apiKey: string): Promise<string> {
    const requestBody: GeminiRequest = {
      systemInstruction: {
        parts: [
          {
            text: this.getSystemPrompt(),
          },
        ],
      },
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await axios.post<GeminiResponse>(
      this.baseUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        timeout: this.requestTimeout,
      },
    );

    if (response.data.error !== undefined) {
      throw new Error(response.data.error.message);
    }

    if (
      response.data.candidates === undefined ||
      response.data.candidates.length === 0 ||
      response.data.candidates[0] === undefined ||
      response.data.candidates[0].content.parts.length === 0 ||
      response.data.candidates[0].content.parts[0] === undefined
    ) {
      throw new Error('Invalid response from Gemini API');
    }

    return response.data.candidates[0].content.parts[0].text;
  }

  private isRateLimitError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return false;
    }

    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      return true;
    }
    const errorMessage = JSON.stringify(
      axiosError.response?.data ?? '',
    ).toLowerCase();
    return (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('resource_exhausted')
    );
  }

  private isLeakedKeyError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return false;
    }
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 403) {
      const errorMessage = JSON.stringify(
        axiosError.response.data ?? '',
      ).toLowerCase();
      return (
        errorMessage.includes('leaked') ||
        errorMessage.includes('permission_denied')
      );
    }
    return false;
  }

  async generateContent(prompt: string): Promise<string> {
    if (this.apiKeys.length === 0) {
      throw new Error(
        'No Gemini API keys configured. Please add API keys to .env file',
      );
    }

    const attemptedKeys = new Set<number>();

    // Try all API keys starting from current index
    while (attemptedKeys.size < this.apiKeys.length) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      if (apiKey === undefined) {
        break;
      }

      const keyNumber = this.currentKeyIndex + 1;

      logger.debug(`Attempting request with API key #${keyNumber}`);

      try {
        const result = await this.callGeminiApi(prompt, apiKey);
        logger.info(`Success with API key #${keyNumber}`);
        return result;
      } catch (error) {
        attemptedKeys.add(this.currentKeyIndex);
        logger.warn(`API key #${keyNumber} failed`, {
          error: (error as Error).message,
        });
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      }
    }

    logger.error('All Gemini API keys have been tried and failed');
    throw new Error(
      'Layanan chatbot tidak tersedia saat ini. Silakan hubungi administrator.',
    );
  }

  async chat(message: string): Promise<string> {
    return this.generateContent(message);
  }

  // Stream generate content with SSE and conversation history
  async *streamGenerateContentWithHistory(
    prompt: string,
    history: { role: string; content: string }[] = [],
  ): AsyncGenerator<string, void, unknown> {
    if (this.apiKeys.length === 0) {
      throw new Error(
        'No Gemini API keys configured. Please add API keys to .env file',
      );
    }

    const attemptedKeys = new Set<number>();

    // Build contents array with history
    const contents: GeminiContent[] = [];

    // Add history messages - convert 'assistant' to 'model' for Gemini API
    // Only include messages that have content
    for (const msg of history) {
      if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
        contents.push({
          parts: [{ text: msg.content }],
          role: msg.role === 'user' ? 'user' : 'model',
        });
      }
    }

    // Add current prompt as user message
    contents.push({
      parts: [{ text: prompt }],
      role: 'user',
    });

    const systemInstruction: GeminiSystemInstruction = {
      parts: [
        {
          text: this.getSystemPrompt(),
        },
      ],
    };

    // Try all API keys starting from current index
    while (attemptedKeys.size < this.apiKeys.length) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      if (apiKey === undefined) {
        break;
      }

      const keyNumber = this.currentKeyIndex + 1;
      logger.debug(`Attempting streaming request with API key #${keyNumber}`);
      logger.debug(`Sending ${contents.length} messages to Gemini API`);

      try {
        const response = await axios.post<ReadableStream>(
          `${this.streamBaseUrl}?key=${apiKey}&alt=sse`,
          {
            systemInstruction,
            contents,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
            timeout: this.streamTimeout,
          },
        );

        const stream = response.data;
        let buffer = '';
        let lastChunkTime = Date.now();
        const CHUNK_TIMEOUT = 30000; // 30s between chunks

        // Process stream chunks with timeout
        for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
          // Check for chunk timeout
          if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
            logger.warn(
              `Stream timeout - no chunks received for ${CHUNK_TIMEOUT}ms`,
            );
            throw new Error('Stream timeout');
          }
          lastChunkTime = Date.now();

          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                logger.info(`Streaming completed with API key #${keyNumber}`);
                return;
              }

              try {
                const parsed = JSON.parse(data) as GeminiResponse;
                const text = parsed.candidates?.[0]?.content.parts[0]?.text;
                if (text !== undefined) {
                  yield text;
                }
              } catch {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }

        logger.info(`Streaming success with API key #${keyNumber}`);
        return;
      } catch (error) {
        attemptedKeys.add(this.currentKeyIndex);
        logger.warn(`API key #${keyNumber} failed`, {
          error: (error as Error).message,
        });
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      }
    }

    logger.error('All Gemini API keys have been tried and failed');
    throw new Error(
      'Layanan chatbot tidak tersedia saat ini. Silakan hubungi administrator.',
    );
  }

  // Stream generate content with SSE
  async *streamGenerateContent(
    prompt: string,
  ): AsyncGenerator<string, void, unknown> {
    if (this.apiKeys.length === 0) {
      throw new Error(
        'No Gemini API keys configured. Please add API keys to .env file',
      );
    }

    const attemptedKeys = new Set<number>();

    // Try all API keys starting from current index
    while (attemptedKeys.size < this.apiKeys.length) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      if (apiKey === undefined) {
        break;
      }

      const keyNumber = this.currentKeyIndex + 1;
      logger.debug(`Attempting streaming request with API key #${keyNumber}`);

      try {
        const response = await axios.post<ReadableStream>(
          `${this.streamBaseUrl}?key=${apiKey}&alt=sse`,
          {
            systemInstruction: {
              parts: [
                {
                  text: this.getSystemPrompt(),
                },
              ],
            },
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
            timeout: this.streamTimeout,
          },
        );

        const stream = response.data;
        let buffer = '';
        let lastChunkTime = Date.now();
        const CHUNK_TIMEOUT = 30000; // 30s between chunks

        // Process stream chunks with timeout
        for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
          // Check for chunk timeout
          if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
            logger.warn(
              `Stream timeout - no chunks received for ${CHUNK_TIMEOUT}ms`,
            );
            throw new Error('Stream timeout');
          }
          lastChunkTime = Date.now();

          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                logger.info(`Streaming completed with API key #${keyNumber}`);
                return;
              }

              try {
                const parsed = JSON.parse(data) as GeminiResponse;
                const text = parsed.candidates?.[0]?.content.parts[0]?.text;
                if (text !== undefined) {
                  yield text;
                }
              } catch {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }

        logger.info(`Streaming success with API key #${keyNumber}`);
        return;
      } catch (error) {
        attemptedKeys.add(this.currentKeyIndex);
        logger.warn(`API key #${keyNumber} failed`, {
          error: (error as Error).message,
        });
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      }
    }

    logger.error('All Gemini API keys have been tried and failed');
    throw new Error(
      'Layanan chatbot tidak tersedia saat ini. Silakan hubungi administrator.',
    );
  }

  // Get current API key status
  getStatus(): {
    totalKeys: number;
    currentKeyIndex: number;
    currentKeyNumber: number;
  } {
    return {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      currentKeyNumber: this.currentKeyIndex + 1,
    };
  }

  // Reset to first API key (useful for testing or manual reset)
  resetToFirstKey(): void {
    this.currentKeyIndex = 0;
    logger.info('Reset to first API key');
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
