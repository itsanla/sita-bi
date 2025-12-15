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
  private primaryModels: string[] = [];
  private fallbackModel = '';
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly streamBaseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models';
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
    this.loadModels();
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

  private loadModels(): void {
    const primaryEnv = process.env['GEMINI_PRIMARY_MODELS'];
    const fallbackEnv = process.env['GEMINI_FALLBACK_MODEL'];

    if (!primaryEnv || !fallbackEnv) {
      throw new Error(
        'GEMINI_PRIMARY_MODELS and GEMINI_FALLBACK_MODEL must be configured in .env',
      );
    }

    this.primaryModels = primaryEnv
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    this.fallbackModel = fallbackEnv.trim();

    logger.info(`Primary models: ${this.primaryModels.join(', ')}`);
    logger.info(`Fallback model: ${this.fallbackModel}`);
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
      const documentationData = fs.existsSync(this.documentationPath)
        ? JSON.parse(fs.readFileSync(this.documentationPath, 'utf-8'))
        : null;

      const informationData = fs.existsSync(this.informationPath)
        ? JSON.parse(fs.readFileSync(this.informationPath, 'utf-8'))
        : null;

      let systemPrompt = ENHANCED_SYSTEM_PROMPT;

      if (documentationData !== null) {
        systemPrompt += `\n\nINFORMASI PATH/LOKASI URL/HALAMAN SISTEM:\n${JSON.stringify(documentationData, null, 2)}`;
      }

      if (informationData !== null) {
        systemPrompt += `\n\nINFORMASI TUGAS AKHIR & PANDUAN PENGGUNA:\n${JSON.stringify(informationData, null, 2)}`;
      }

      // Cache the prompt
      this.systemPromptCache = systemPrompt;
      this.systemPromptCacheTime = now;

      return systemPrompt;
    } catch (error) {
      logger.error('Error loading system prompt data', error);
      this.systemPromptCache = ENHANCED_SYSTEM_PROMPT;
      this.systemPromptCacheTime = now;
      return ENHANCED_SYSTEM_PROMPT;
    }
  }

  private async callGeminiApi(
    prompt: string,
    apiKey: string,
    model: string,
  ): Promise<string> {
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
      `${this.baseUrl}/${model}:generateContent`,
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
      throw new Error('No Gemini API keys configured');
    }

    // Try primary models with all API keys
    for (const model of this.primaryModels) {
      for (let i = 0; i < this.apiKeys.length; i++) {
        const apiKey = this.apiKeys[i];
        if (!apiKey) continue;

        const keyNumber = i + 1;
        console.log(
          `🔄 [Gemini] Trying PRIMARY model: ${model} | API Key: #${keyNumber}`,
        );

        try {
          const result = await this.callGeminiApi(prompt, apiKey, model);
          console.log(
            `✅ [Gemini] SUCCESS with PRIMARY model: ${model} | API Key: #${keyNumber}`,
          );
          return result;
        } catch (error) {
          console.log(
            `❌ [Gemini] FAILED PRIMARY model: ${model} | API Key: #${keyNumber}`,
          );
        }
      }
    }

    // All primary models exhausted, try fallback
    console.log(
      `⚠️  [Gemini] All PRIMARY models exhausted, switching to FALLBACK model`,
    );

    for (let i = 0; i < this.apiKeys.length; i++) {
      const apiKey = this.apiKeys[i];
      if (!apiKey) continue;

      const keyNumber = i + 1;
      console.log(
        `🔄 [Gemini] Trying FALLBACK model: ${this.fallbackModel} | API Key: #${keyNumber}`,
      );

      try {
        const result = await this.callGeminiApi(
          prompt,
          apiKey,
          this.fallbackModel,
        );
        console.log(
          `✅ [Gemini] SUCCESS with FALLBACK model: ${this.fallbackModel} | API Key: #${keyNumber}`,
        );
        return result;
      } catch (error) {
        console.log(
          `❌ [Gemini] FAILED FALLBACK model: ${this.fallbackModel} | API Key: #${keyNumber}`,
        );
      }
    }

    logger.error('All models and API keys exhausted');
    throw new Error('All API keys exhausted');
  }

  async chat(message: string): Promise<string> {
    return this.generateContent(message);
  }

  async *streamGenerateContentWithHistory(
    prompt: string,
    history: { role: string; content: string }[] = [],
  ): AsyncGenerator<string, void, unknown> {
    if (this.apiKeys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }

    const contents: GeminiContent[] = [];
    for (const msg of history) {
      if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
        const content = msg.content.trim();
        if (
          content.includes('SitaBot sedang tidak dapat digunakan') ||
          content.includes('baca dokumentasi yang sudah disediakan')
        ) {
          continue;
        }
        contents.push({
          parts: [{ text: msg.content }],
          role: msg.role === 'user' ? 'user' : 'model',
        });
      }
    }
    contents.push({ parts: [{ text: prompt }], role: 'user' });

    const systemInstruction: GeminiSystemInstruction = {
      parts: [{ text: this.getSystemPrompt() }],
    };

    for (const model of this.primaryModels) {
      for (let i = 0; i < this.apiKeys.length; i++) {
        const apiKey = this.apiKeys[i];
        if (!apiKey) continue;

        console.log(
          `🔄 [Gemini Stream] Trying PRIMARY model: ${model} | API Key: #${i + 1}`,
        );

        try {
          const response = await axios.post<ReadableStream>(
            `${this.streamBaseUrl}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
            { systemInstruction, contents },
            {
              headers: { 'Content-Type': 'application/json' },
              responseType: 'stream',
              timeout: this.streamTimeout,
            },
          );

          let buffer = '';
          for await (const chunk of response.data as unknown as AsyncIterable<Buffer>) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '' || data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data) as GeminiResponse;
                  const text = parsed.candidates?.[0]?.content.parts[0]?.text;
                  if (text) yield text;
                } catch {
                  continue;
                }
              }
            }
          }
          console.log(
            `✅ [Gemini Stream] SUCCESS with PRIMARY model: ${model} | API Key: #${i + 1}`,
          );
          return;
        } catch (error) {
          console.log(
            `❌ [Gemini Stream] FAILED PRIMARY model: ${model} | API Key: #${i + 1}`,
          );
        }
      }
    }

    console.log(
      `⚠️  [Gemini Stream] All PRIMARY models exhausted, switching to FALLBACK`,
    );

    for (let i = 0; i < this.apiKeys.length; i++) {
      const apiKey = this.apiKeys[i];
      if (!apiKey) continue;

      console.log(
        `🔄 [Gemini Stream] Trying FALLBACK model: ${this.fallbackModel} | API Key: #${i + 1}`,
      );

      try {
        const response = await axios.post<ReadableStream>(
          `${this.streamBaseUrl}/${this.fallbackModel}:streamGenerateContent?key=${apiKey}&alt=sse`,
          { systemInstruction, contents },
          {
            headers: { 'Content-Type': 'application/json' },
            responseType: 'stream',
            timeout: this.streamTimeout,
          },
        );

        let buffer = '';
        for await (const chunk of response.data as unknown as AsyncIterable<Buffer>) {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '' || data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data) as GeminiResponse;
                const text = parsed.candidates?.[0]?.content.parts[0]?.text;
                if (text) yield text;
              } catch {
                continue;
              }
            }
          }
        }
        console.log(
          `✅ [Gemini Stream] SUCCESS with FALLBACK model: ${this.fallbackModel} | API Key: #${i + 1}`,
        );
        return;
      } catch (error) {
        console.log(
          `❌ [Gemini Stream] FAILED FALLBACK model: ${this.fallbackModel} | API Key: #${i + 1}`,
        );
      }
    }

    throw new Error('All API keys exhausted');
  }

  async *streamGenerateContent(
    prompt: string,
  ): AsyncGenerator<string, void, unknown> {
    return this.streamGenerateContentWithHistory(prompt, []);
  }

  getStatus(): {
    totalKeys: number;
    primaryModels: string[];
    fallbackModel: string;
  } {
    return {
      totalKeys: this.apiKeys.length,
      primaryModels: this.primaryModels,
      fallbackModel: this.fallbackModel,
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
