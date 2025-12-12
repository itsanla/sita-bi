'use client';
import React, { useState } from 'react';
import Header from './Header';

interface HeaderWrapperProps {
  activeSection?: string;
  scrollToSection?: (_id: string) => void;
  mode?: 'landing' | 'static';
  activePage?: string;
}

export default function HeaderWrapper({
  activeSection = 'hero',
  scrollToSection = () => {},
  mode = 'landing',
  activePage = '',
}: HeaderWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Header
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
      activeSection={activeSection}
      scrollToSection={scrollToSection}
      mode={mode}
      activePage={activePage}
    />
  );
}
