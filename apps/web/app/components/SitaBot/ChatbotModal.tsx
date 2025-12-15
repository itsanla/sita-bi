'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { useChatLogic } from './use-chat-logic';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    messages,
    input,
    isLoading,
    mode,
    setMode,
    thinkingStatus,
    chatContainerRef,
    textareaRef,
    setInput,
    handleSubmit,
    stop,
    clearHistory,
  } = useChatLogic();

  const handleClose = useCallback(() => {
    clearHistory();
    onClose();
  }, [clearHistory, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShowIntro(true);
      setModalVisible(false);
      setTimeout(() => setModalVisible(true), 50);

      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSendClick = () => {
    if (!input.trim() || isLoading) return;

    const fakeEvent: any = { preventDefault: () => {} };
    void handleSubmit(fakeEvent);
  };

  return (
    <>
      {/* Backdrop Overlay - covers everything including header */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 z-[998] ${modalVisible ? 'opacity-60' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal Container - above backdrop */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-[999] p-4 transition-all duration-500 ${modalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {showIntro ? (
          /* Premium Intro Animation */
          <div className="relative">
            {/* Glow Effect Layers */}
            <div className="absolute inset-0 -m-32">
              <div className="absolute inset-0 bg-gradient-radial from-red-400/30 via-red-500/20 to-transparent blur-3xl animate-pulse-slow" />
              <div
                className="absolute inset-0 bg-gradient-radial from-white/20 via-transparent to-transparent blur-2xl animate-spin-slow"
                style={{ animationDuration: '8s' }}
              />
            </div>

            {/* Sparkle Effects */}
            <div className="absolute -top-10 -left-10 animate-float">
              <Sparkles className="w-8 h-8 text-red-300 opacity-60" />
            </div>
            <div
              className="absolute -bottom-10 -right-10 animate-float"
              style={{ animationDelay: '1s' }}
            >
              <Sparkles className="w-6 h-6 text-red-400 opacity-80" />
            </div>
            <div
              className="absolute top-1/2 -right-16 animate-float"
              style={{ animationDelay: '0.5s' }}
            >
              <Sparkles className="w-5 h-5 text-white opacity-70" />
            </div>

            {/* Mascot with Premium Glow */}
            <div className="relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full blur-xl opacity-40 animate-pulse" />
                <MessageCircle className="w-56 h-56 text-white relative z-10 drop-shadow-2xl animate-gentle-bounce" />
              </div>
              <div className="text-center mt-6 relative z-10">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                  SitaBot AI
                </h2>
                <p className="text-red-100 font-medium drop-shadow-md flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your Thesis Assistant
                  <Sparkles className="w-4 h-4" />
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden  animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-red-700 px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    SitaBot AI
                    <Sparkles className="w-4 h-4" />
                  </h1>
                  <p className="text-xs text-red-100">Your Thesis Assistant</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Chat Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto bg-gradient-to-br from-red-50/50 via-white to-red-50/30"
            >
              <div className="px-6 py-8 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                      <MessageCircle className="w-28 h-28 text-red-600 relative z-10 opacity-90" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
                      Halo! Saya SitaBot AI 👋
                    </h2>
                    <p className="text-gray-500 text-center max-w-md mb-8">
                      Tanyakan apa saja tentang sistem tugas akhir, topik
                      penelitian, atau bantuan lainnya!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                      {[
                        {
                          icon: '📚',
                          text: 'Bagaimana cara mengajukan topik?',
                        },
                        { icon: '📝', text: 'Panduan bimbingan tugas akhir' },
                        { icon: '📅', text: 'Jadwal sidang proposal' },
                        { icon: '💡', text: 'Tips memilih topik penelitian' },
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(prompt.text)}
                          className="px-4 py-3 bg-white border-2 border-red-100 rounded-xl text-left text-gray-700 hover:border-red-400 hover:bg-red-50 hover:shadow-md transition-all duration-200 group"
                        >
                          <span className="text-lg mr-2 group-hover:scale-110 inline-block transition-transform">
                            {prompt.icon}
                          </span>
                          {prompt.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages
                    .filter((msg) => msg.content.trim() !== '')
                    .map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-2xl px-5 py-3 rounded-2xl shadow-md ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-red-900 to-red-700'
                              : 'bg-white text-gray-800 border border-red-100'
                          }`}
                        >
                          <div
                            className={`max-w-none ${
                              msg.role === 'user' ? 'text-white' : ''
                            }`}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1
                                    className={`text-lg font-bold mb-2 mt-3 ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-red-900'
                                    }`}
                                  >
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2
                                    className={`text-base font-bold mb-2 mt-2 ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-red-900'
                                    }`}
                                  >
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3
                                    className={`text-sm font-semibold mb-1 mt-2 ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-red-800'
                                    }`}
                                  >
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p
                                    className={`mb-2 text-sm leading-relaxed ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong
                                    className={`font-semibold ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-red-800'
                                    }`}
                                  >
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em
                                    className={`italic ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {children}
                                  </em>
                                ),
                                code: ({ children }) => (
                                  <code
                                    className={`px-1 py-0.5 rounded text-xs font-mono ${
                                      msg.role === 'user'
                                        ? 'bg-red-800 text-white'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    {children}
                                  </code>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-0.5 text-sm">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-0.5 text-sm">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li
                                    className={`ml-2 text-sm ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {children}
                                  </li>
                                ),
                                a: ({ children, href }) => (
                                  <a
                                    href={href}
                                    className={`hover:underline ${
                                      msg.role === 'user'
                                        ? 'text-white'
                                        : 'text-red-600'
                                    }`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote
                                    className={`border-l-4 pl-4 py-2 my-2 italic ${
                                      msg.role === 'user'
                                        ? 'border-white text-white bg-red-800'
                                        : 'border-red-500 text-gray-700 bg-red-50'
                                    }`}
                                  >
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {msg.content || '...'}
                            </ReactMarkdown>
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ml-3 flex-shrink-0 shadow-lg">
                            <span className="text-gray-600 font-semibold text-xs">
                              You
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                )}

                {!!isLoading &&
                  !(
                    messages.length > 0 &&
                    messages[messages.length - 1]?.role === 'assistant' &&
                    messages[messages.length - 1]?.content.trim() !== ''
                  ) && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white border border-red-100 px-5 py-3 rounded-2xl shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-2">
                            <div className="w-2 h-2 bg-red-900 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-red-900 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                            <div
                              className="w-2 h-2 bg-red-900 rounded-full animate-bounce"
                              style={{ animationDelay: '0.4s' }}
                            />
                          </div>
                          {thinkingStatus !== null && (
                            <span className="text-xs text-gray-500 italic">
                              {thinkingStatus === 'thinking'
                                ? 'Berpikir Keras...'
                                : 'Riset Mendalam...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-red-100 px-6 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'fast' | 'expert')}
                  disabled={isLoading}
                  className="px-4 py-3 border-2 border-red-100 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-800 bg-white cursor-pointer hover:border-red-300 hover:shadow-md font-medium text-sm flex-shrink-0"
                >
                  <option value="fast">⚡ Cepat</option>
                  <option value="expert">🎓 Ahli</option>
                </select>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    const newHeight = Math.max(
                      48,
                      Math.min(target.scrollHeight, window.innerHeight * 0.28),
                    );
                    target.style.height = newHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                      e.preventDefault();
                      handleSendClick();
                    }
                  }}
                  placeholder="Ketik pertanyaan Anda di sini..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 px-5 py-3 border-2 border-red-100 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-800 placeholder-gray-400 bg-white min-w-0 resize-none overflow-hidden"
                />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="p-2.5 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 flex items-center justify-center"
                    aria-label="Stop generating"
                  >
                    <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                  </button>
                ) : (
                  <button
                    onClick={handleSendClick}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl hover:from-red-800 hover:to-red-600 disabled:from-red-300 disabled:to-red-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                SitaBot AI dapat membuat kesalahan. Mohon verifikasi informasi
                penting.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes gentle-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        .animate-gentle-bounce {
          animation: gentle-bounce 2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow linear infinite;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </>
  );
}
