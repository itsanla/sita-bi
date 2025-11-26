import { z } from 'zod';

// Request DTOs
export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long. Maximum 10000 characters')
    .trim()
    .transform((val) =>
      val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
    ), // XSS protection
});

export const ChatStreamRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long. Maximum 10000 characters')
    .trim()
    .transform((val) =>
      val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
    ),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(50000),
      }),
    )
    .max(50, 'History too long')
    .optional()
    .default([]),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatStreamRequest = z.infer<typeof ChatStreamRequestSchema>;

// Response DTOs
export interface ChatSuccessResponse {
  success: true;
  data: {
    message: string;
    apiKeyUsed: number;
  };
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export interface StatusResponse {
  success: true;
  data: {
    totalApiKeys: number;
    currentApiKeyNumber: number;
    message: string;
  };
}

export interface ResetResponse {
  success: true;
  message: string;
}
