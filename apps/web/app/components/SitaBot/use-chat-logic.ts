'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_CACHE_KEY = 'sitabot_chat_history';

export function useChatLogic() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CHAT_CACHE_KEY);
      if (cached) {
        try {
          const parsedMessages = JSON.parse(cached);
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Failed to load chat history:', error);
        }
      }
    }
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(
      0,
      chatContainerRef.current.scrollHeight,
    );
  }, [messages]);

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.warn('>>> [FRONTEND] Stream stopped by user.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Call backend Gemini API through Next.js API proxy with chat history
      // Send only completed messages (exclude the empty assistant message we just added)
      const historyToSend = messages.filter((msg) => msg.content.trim() !== '');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
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
              } else if (parsed.type === 'done') {
                break;
              } else if (parsed.type === 'error') {
                console.error('Stream error:', parsed.error);
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
            } catch (err) {
              console.error('Failed to parse JSON', err);
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Fetch aborted by user.');
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.content.trim() === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else {
        console.error('Fetch error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        let userMessage = '😔 Maaf, terjadi kesalahan. Silakan coba lagi.';
        
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
          userMessage = '😔 Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
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
      setIsLoading(false);
      abortControllerRef.current = null;
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
