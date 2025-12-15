'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatLogic } from '../components/SitaBot/use-chat-logic';

export default function ChatbotPage() {
  const router = useRouter();
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
  } = useChatLogic();

  const handleSendClick = () => {
    if (!input.trim() || isLoading) return;

    const fakeEvent: any = { preventDefault: () => {} };
    void handleSubmit(fakeEvent);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-red-50/50 via-white to-red-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 to-red-700 px-4 py-3 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            SitaBot AI
            <Sparkles className="w-4 h-4" />
          </h1>
          <p className="text-xs text-red-100">Your Thesis Assistant</p>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <MessageCircle className="w-20 h-20 text-red-600 relative z-10 opacity-90" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
                Halo! Saya SitaBot AI 👋
              </h2>
              <p className="text-gray-500 text-center text-sm px-4 mb-6">
                Tanyakan apa saja tentang sistem tugas akhir, topik penelitian,
                atau bantuan lainnya!
              </p>
              <div className="grid grid-cols-1 gap-2 w-full px-4">
                {[
                  { icon: '📚', text: 'Bagaimana cara mengajukan topik?' },
                  { icon: '📝', text: 'Panduan bimbingan tugas akhir' },
                  { icon: '📅', text: 'Jadwal sidang proposal' },
                  { icon: '💡', text: 'Tips memilih topik penelitian' },
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt.text)}
                    className="px-4 py-3 bg-white border-2 border-red-100 rounded-xl text-left text-sm text-gray-700 hover:border-red-400 hover:bg-red-50 transition-all"
                  >
                    <span className="text-base mr-2">{prompt.icon}</span>
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
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center mr-2 flex-shrink-0 shadow-lg">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-md text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-red-900 to-red-700'
                        : 'bg-white text-gray-800 border border-red-100'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ children }) => (
                          <h2
                            className={`text-sm font-bold mb-1.5 mt-1.5 ${
                              msg.role === 'user'
                                ? 'text-white'
                                : 'text-red-900'
                            }`}
                          >
                            {children}
                          </h2>
                        ),
                        p: ({ children }) => (
                          <p
                            className={`mb-1.5 text-sm leading-relaxed ${
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
                          <ul className="list-disc list-inside mb-1.5 space-y-0.5 text-sm">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-1.5 space-y-0.5 text-sm">
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
                      }}
                    >
                      {msg.content || '...'}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ml-2 flex-shrink-0 shadow-lg">
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
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center mr-2 flex-shrink-0 shadow-lg">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-red-100 px-4 py-2.5 rounded-2xl shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-red-900 rounded-full animate-bounce" />
                      <div
                        className="w-1.5 h-1.5 bg-red-900 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-red-900 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                    {thinkingStatus !== null && (
                      <span className="text-xs text-gray-500 italic">
                        {thinkingStatus === 'thinking'
                          ? 'Berpikir...'
                          : 'Riset...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-red-100 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'fast' | 'expert')}
            disabled={isLoading}
            className="px-3 py-2 border-2 border-red-100 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none disabled:bg-gray-50"
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
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendClick();
              }
            }}
            placeholder="Ketik pertanyaan..."
            disabled={isLoading}
            rows={1}
            className="flex-1 px-3 py-2 border-2 border-red-100 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none resize-none"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="p-2 bg-gray-300 text-gray-800 rounded-lg"
            >
              <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
            </button>
          ) : (
            <button
              onClick={handleSendClick}
              disabled={!input.trim()}
              className="p-2 bg-gradient-to-r from-red-900 to-red-700 text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center">
          SitaBot AI dapat membuat kesalahan
        </p>
      </div>
    </div>
  );
}
