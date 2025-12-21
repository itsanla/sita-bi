import { CalendarDays, CodeXml } from 'lucide-react';
import TeamMemberCard from '../../components/landing-page/TeamMemberCard';
import { teamMembers, nextGenDeveloper } from '../data/teamData';

export default function TeamSection() {
  if (!teamMembers || !nextGenDeveloper) {
    return null;
  }

  return (
    <section id="team" className="mb-20 scroll-mt-24">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Pengembang
        </h1>
        <p className="text-lg text-gray-600 flex items-center">
          <CodeXml className="mr-2 text-red-900" size={22} />
          Evolusi tim pengembang sistem SITA-BI
        </p>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-900 text-white text-sm font-medium shadow-sm">
            <CalendarDays size={16} />
            <span>Maret - Juli 2025</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-1 text-center">
            Team 7 PBL 2025
          </h3>
          <p className="text-center text-gray-600 mb-8 text-sm">
            Tim foundational yang membangun SITA-BI
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, idx) => (
              <TeamMemberCard key={member.id} member={member} index={idx} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-12 roadmap-line-container">
        <div className="flex flex-col items-center relative">
          <div className="w-px h-16 bg-gray-300 relative overflow-hidden">
            <div className="roadmap-line-animated absolute top-0 left-0 w-full h-0 bg-red-900"></div>
          </div>
          <div className="w-3 h-3 bg-red-900 rounded-full"></div>
          <div className="w-px h-16 bg-gray-300 relative overflow-hidden">
            <div className="roadmap-line-animated absolute top-0 left-0 w-full h-0 bg-red-900"></div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-900 text-white text-sm font-medium shadow-sm">
            <CalendarDays size={16} />
            <span>Agustus - Desember 2025</span>
          </div>
        </div>

        <div className="max-w-sm mx-auto bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-1 text-center">
            Project IT 2025
          </h3>
          <p className="text-center text-gray-600 mb-8 text-sm">
            Evolusi dan enhancement sistem
          </p>

          <div className="grid grid-cols-1 gap-6">
            <TeamMemberCard member={nextGenDeveloper} index={0} />
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .roadmap-line-animated {
            animation: expandLine 0.8s ease-in-out forwards;
            animation-play-state: paused;
          }

          .roadmap-line-container.animate .roadmap-line-animated {
            animation-play-state: running;
          }

          @keyframes expandLine {
            from {
              height: 0%;
            }
            to {
              height: 100%;
            }
          }
        `,
        }}
      />
    </section>
  );
}
