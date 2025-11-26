'use client';
import React, { useState } from 'react';
import Header from './Header';

interface HeaderWrapperProps {
  activeSection?: string;
  scrollToSection?: (_id: string) => void;
}

export default function HeaderWrapper({
  activeSection = 'hero',
  scrollToSection = () => {},
}: HeaderWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Header
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
      activeSection={activeSection}
      scrollToSection={scrollToSection}
    />
  );
}
