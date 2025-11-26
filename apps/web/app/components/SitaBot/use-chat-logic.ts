'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_CACHE_KEY = 'sitabot_chat_history';
const MAX_HISTORY_SIZE = 50; // Limit history to prevent overflow
const MAX_RETRIES = 2;

export function useChatLogic() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<number>(0);

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CHAT_CACHE_KEY);
      if (cached) {
        try {
          const parsedMessages = JSON.parse(cached) as Message[];
          setMessages(parsedMessages);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save messages to sessionStorage whenever they change (with size limit)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      // Keep only last MAX_HISTORY_SIZE messages
      const limitedMessages = messages.slice(-MAX_HISTORY_SIZE);
      try {
        sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(limitedMessages));
      } catch {
        // Handle quota exceeded - clear old history
        sessionStorage.removeItem(CHAT_CACHE_KEY);
      }
    }
  }, [messages]);

  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || isUserScrollingRef.current) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (isNearBottom) {
      container.scrollTo(0, container.scrollHeight);
    }
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      isUserScrollingRef.current = !isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e: FormEvent, retryCount = 0) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    const requestId = ++currentRequestIdRef.current;

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Call backend Gemini API through Next.js API proxy with chat history
      // Send only completed messages (exclude the empty assistant message we just added)
      const historyToSend = messages.filter((msg) => msg.content.trim() !== '');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }
      const response = await fetch(`${apiUrl}/api/gemini/chat/stream/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: historyToSend,
        }),
        signal: abortController.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');

        while (boundary !== -1) {
          const message = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);

          if (message.startsWith('data: ')) {
            const data = message.substring(6);

            try {
              const parsed = JSON.parse(data);

              // Handle different event types from backend
              if (parsed.type === 'chunk' && parsed.text) {
                setMessages((prev) => {
                  if (prev.length === 0) return prev;
                  const allButLast = prev.slice(0, -1);
                  const last = prev[prev.length - 1];
                  if (!last || last.role !== 'assistant') return prev;
                  const updatedLast = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return [...allButLast, updatedLast];
                });
                // Force immediate render
                await new Promise(resolve => setTimeout(resolve, 0));
              } else if (parsed.type === 'done') {
                break;
              } else if (parsed.type === 'error') {
                setMessages((prev) => {
                  const allButLast = prev.slice(0, -1);
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'assistant') {
                    return [
                      ...allButLast,
                      {
                        ...last,
                        content: `😔 ${parsed.error || 'Maaf, terjadi kesalahan. Silakan coba lagi.'}`,
                      },
                    ];
                  }
                  return prev;
                });
                break;
              }
            } catch {
              // Skip invalid JSON
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      // Only handle if this is still the current request
      if (requestId !== currentRequestIdRef.current) {
        return;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.content.trim() === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        let userMessage = '😔 Maaf, terjadi kesalahan. Silakan coba lagi.';
        let shouldRetry = false;

        if (
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('NetworkError')
        ) {
          userMessage =
            '😔 Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
          shouldRetry = retryCount < MAX_RETRIES;
        } else if (errorMsg.includes('timeout')) {
          userMessage = '😔 Permintaan timeout. Mencoba lagi...';
          shouldRetry = retryCount < MAX_RETRIES;
        }

        if (shouldRetry) {
          // Retry logic
          // Remove empty assistant message before retry
          setMessages((prev) => prev.slice(0, -1));
          // Restore input for retry
          setInput(currentInput);
          setIsLoading(false);
          // Retry after delay
          setTimeout(
            () => {
              const fakeEvent = { preventDefault: () => {} } as FormEvent;
              void handleSubmit(fakeEvent, retryCount + 1);
            },
            1000 * (retryCount + 1),
          ); // Exponential backoff
          return;
        }

        setMessages((prev) => {
          const allButLast = prev.slice(0, -1);
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [
              ...allButLast,
              {
                ...last,
                content: last.content.trim() || userMessage,
              },
            ];
          }
          return prev;
        });
      }
    } finally {
      // Only clear loading if this is still the current request
      if (requestId === currentRequestIdRef.current) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHAT_CACHE_KEY);
      setMessages([]);
    }
  };

  return {
    messages,
    input,
    isLoading,
    chatContainerRef,
    setInput,
    handleSubmit,
    stop,
    clearHistory,
  };
}
