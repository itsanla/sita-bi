'use client';

import { useState, useEffect } from 'react';
import HeaderWrapper from '../components/landing-page/HeaderWrapper';
import DocSidebar from './components/DocSidebar';
import { menuItems } from './data/menuItems';
import TeamSection from './sections/TeamSection';
import IntroductionSection from './sections/IntroductionSection';
import GettingStartedSection from './sections/GettingStartedSection';
import MahasiswaSection from './sections/MahasiswaSection';
import DosenSection from './sections/DosenSection';
import AdminSection from './sections/AdminSection';
import FeaturesSection from './sections/FeaturesSection';
import TechnologySection from './sections/TechnologySection';
import FooterSection from './sections/FooterSection';

export default function DocumentationContent() {
  const [activeSection, setActiveSection] = useState('team');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'introduction',
    'getting-started',
  ]);
  const [roadmapAnimated, setRoadmapAnimated] = useState(false);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setSidebarOpen(false);
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.flatMap((item) => {
        if (item.children) {
          return [item.id, ...item.children.map((child) => child.id)];
        }
        return [item.id];
      });

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }

      const roadmapLine = document.querySelector('.roadmap-line-container');
      if (roadmapLine) {
        const rect = roadmapLine.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top <= windowHeight * 0.75 && !roadmapAnimated) {
          roadmapLine.classList.add('animate');
          setRoadmapAnimated(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [roadmapAnimated]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWrapper
        mode="static"
        activePage="docs"
        scrollToSection={() => {}}
      />

      <div className="flex pt-20">
        <DocSidebar
          menuItems={menuItems}
          activeSection={activeSection}
          expandedMenus={expandedMenus}
          sidebarOpen={sidebarOpen}
          onToggleMenu={toggleMenu}
          onScrollToSection={scrollToSection}
          onCloseSidebar={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
            <TeamSection />
            <IntroductionSection />
            <GettingStartedSection />
            <MahasiswaSection />
            <DosenSection />
            <AdminSection />
            <FeaturesSection />
            <TechnologySection />
            <FooterSection />
          </div>
        </main>
      </div>
    </div>
  );
}
