'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';

const ChatbotModal = dynamic(() => import('./ChatbotModal'), {
  ssr: false,
});

export default function SitaBotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = () => {
    if (isMobile) {
      router.push('/chatbot');
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="border-2 border-red-900 text-red-900 px-10 py-4 rounded-full font-semibold bg-white hover:bg-red-900 hover:text-white hover:-translate-y-1 transition-all flex items-center gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        SitaBot
      </button>
      {!isMobile && isOpen ? (
        <ChatbotModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
