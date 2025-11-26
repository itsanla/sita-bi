// Type definitions for Gemini API

export interface GeminiChatRequest {
  message: string;
}

export interface GeminiChatResponse {
  success: true;
  data: {
    message: string;
    apiKeyUsed: number;
  };
}

export interface GeminiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export interface GeminiStatusResponse {
  success: true;
  data: {
    totalApiKeys: number;
    currentApiKeyNumber: number;
    message: string;
  };
}

export interface GeminiResetResponse {
  success: true;
  message: string;
}

// SSE Event Types
export type SSEEventType = 'chunk' | 'connected' | 'done' | 'error';

export interface SSEConnectedEvent {
  type: 'connected';
}

export interface SSEChunkEvent {
  type: 'chunk';
  text: string;
}

export interface SSEDoneEvent {
  type: 'done';
}

export interface SSEErrorEvent {
  type: 'error';
  error: string;
}

export type SSEEvent =
  | SSEChunkEvent
  | SSEConnectedEvent
  | SSEDoneEvent
  | SSEErrorEvent;

export type GeminiApiResponse =
  | GeminiChatResponse
  | GeminiErrorResponse
  | GeminiResetResponse
  | GeminiStatusResponse;
