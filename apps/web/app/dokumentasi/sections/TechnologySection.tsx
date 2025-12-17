export default function TechnologySection() {
  return (
    <section id="technology" className="mb-16 scroll-mt-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Teknologi & Stack
      </h1>
      <div className="prose max-w-none">
        <p className="text-gray-700 leading-relaxed mb-6">
          SITA-BI dibangun dengan teknologi modern dan best practices industry
          standard.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {[
            {
              title: 'Frontend Stack',
              items: [
                { name: 'Next.js 15', desc: 'React framework with SSR & SSG' },
                { name: 'TypeScript', desc: 'Type-safe development' },
                { name: 'Tailwind CSS', desc: 'Utility-first CSS framework' },
                { name: 'Lucide Icons', desc: 'Beautiful icon library' },
              ],
            },
            {
              title: 'Backend Stack',
              items: [
                {
                  name: 'Express.js',
                  desc: 'Fast & minimalist Node.js framework',
                },
                { name: 'SQLite', desc: 'Lightweight relational database' },
                { name: 'Prisma ORM', desc: 'Type-safe database client' },
                {
                  name: 'Passport.js + JWT',
                  desc: 'Authentication & authorization',
                },
              ],
            },
            {
              title: 'DevOps & Tools',
              items: [
                { name: 'Turborepo', desc: 'Monorepo build system' },
                { name: 'pnpm', desc: 'Fast package manager' },
                { name: 'ESLint & Prettier', desc: 'Code quality tools' },
                { name: 'Google Gemini AI', desc: 'AI chatbot integration' },
              ],
            },
          ].map((stack, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h4 className="font-bold text-red-900 mb-4 text-lg">
                {stack.title}
              </h4>
              <ul className="space-y-3 text-sm">
                {stack.items.map((item, j) => (
                  <li key={j} className="flex items-start">
                    <span className="w-2 h-2 bg-red-900 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <strong className="text-gray-900">{item.name}</strong>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-bold text-gray-900 mb-3">
            Why These Technologies?
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            {[
              {
                icon: '🚀',
                title: 'Performance',
                desc: 'Next.js SSR/SSG ensures fast page loads. SQLite provides quick read/write operations with zero configuration.',
              },
              {
                icon: '🔒',
                title: 'Security',
                desc: 'Passport.js with JWT authentication, bcrypt password hashing, dan session management melindungi data pengguna.',
              },
              {
                icon: '📈',
                title: 'Scalability',
                desc: 'Monorepo architecture dengan Turborepo memudahkan scaling dan deployment aplikasi secara modular.',
              },
              {
                icon: '🛠️',
                title: 'Maintainability',
                desc: 'TypeScript 100% ensures type safety. Clean architecture dengan service layer makes code easy to maintain.',
              },
            ].map((reason, i) => (
              <div key={i}>
                <p className="font-medium mb-2">
                  {reason.icon} {reason.title}
                </p>
                <p className="text-gray-600">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
